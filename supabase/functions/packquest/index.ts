import { createClient } from 'npm:@supabase/supabase-js@2.117.2'

type Payload = Record<string, unknown>

const localOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173']
const allowedOrigins = new Set([
  ...localOrigins,
  ...(Deno.env.get('PACKQUEST_ALLOWED_ORIGINS') ?? '')
    .split(',').map((origin) => origin.trim()).filter(Boolean),
])

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'Vary': 'Origin',
      ...(origin && allowedOrigins.has(origin)
        ? { 'Access-Control-Allow-Origin': origin }
        : {}),
    },
  })
}

function fail(message: string, status: number, origin: string | null): Response {
  return json({ error: message }, status, origin)
}

function field(body: Payload, key: string, max = 240): string | null {
  const value = body[key]
  return typeof value === 'string' && value.length <= max ? value : null
}

function uuid(body: Payload, key: string): string | null {
  const value = field(body, key, 36)
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value : null
}

function capability(body: Payload, key: string): string | null {
  const value = field(body, key, 43)
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null
}

function newCapability(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function hash(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function databaseError(code: string | undefined, origin: string | null): Response {
  if (code === '40001' || code === '23505') return fail('Les données ont changé. Actualisez et réessayez.', 409, origin)
  if (code === '42501') return fail('Accès refusé.', 403, origin)
  if (code === '22023' || code === '23514' || code === '23503') {
    return fail('Cette action est impossible avec les données fournies.', 400, origin)
  }
  return fail('Une erreur est survenue. Réessayez.', 500, origin)
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin')
  if (origin && !allowedOrigins.has(origin)) return fail('Origine refusée.', 403, null)

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Vary': 'Origin',
        ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
        'Access-Control-Max-Age': '600',
      },
    })
  }
  if (request.method !== 'POST') return fail('Méthode non autorisée.', 405, origin)
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return fail('Corps JSON requis.', 415, origin)
  }
  if (!supabaseUrl || !serviceKey) {
    return fail('Service indisponible.', 503, origin)
  }

  let body: Payload
  try {
    const raw = await request.text()
    if (raw.length > 16_384) return fail('Requête trop volumineuse.', 413, origin)
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return fail('Corps JSON invalide.', 400, origin)
    }
    body = parsed as Payload
  } catch {
    return fail('Corps JSON invalide.', 400, origin)
  }

  const action = field(body, 'action', 40)
  if (!action) return fail('Action manquante.', 400, origin)

  const service = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    if (action === 'pair') {
      const token = capability(body, 'token')
      if (!token) return fail('Lien d’appairage invalide.', 400, origin)
      const deviceToken = newCapability()
      const { data, error } = await service.rpc('packquest_redeem_pairing', {
        p_token_hash: await hash(token),
        p_device_hash: await hash(deviceToken),
      })
      if (error?.code === '22023') {
        return fail('Ce QR code a expiré ou a déjà été utilisé.', 400, origin)
      }
      if (error) return databaseError(error.code, origin)
      return json({ ...data, device_token: deviceToken }, 200, origin)
    }

    if (['get_missions', 'start_mission', 'update_item', 'request_help', 'complete_mission'].includes(action)) {
      const deviceToken = capability(body, 'device_token')
      if (!deviceToken) return fail('Cet appareil doit rejoindre la famille.', 401, origin)
      const deviceHash = await hash(deviceToken)

      if (action === 'get_missions') {
        const { data, error } = await service.rpc('packquest_child_snapshot', {
          p_device_hash: deviceHash,
        })
        if (error) return databaseError(error.code, origin)
        return json(data, 200, origin)
      }

      const mutationId = uuid(body, 'mutation_id')
      if (!mutationId) return fail('Identifiant de changement manquant.', 400, origin)
      const missionId = action === 'start_mission' || action === 'complete_mission'
        ? uuid(body, 'mission_id') : null
      const itemId = action === 'update_item' || action === 'request_help'
        ? uuid(body, 'item_id') : null
      if ((action === 'start_mission' || action === 'complete_mission') && !missionId) {
        return fail('Mission invalide.', 400, origin)
      }
      if ((action === 'update_item' || action === 'request_help') && !itemId) {
        return fail('Affaire invalide.', 400, origin)
      }
      const status = action === 'update_item' ? field(body, 'status', 12) : null
      if (action === 'update_item' && !['pending', 'packed', 'not_found', 'missing'].includes(status ?? '')) {
        return fail('État d’affaire invalide.', 400, origin)
      }
      const expectedVersion = action === 'update_item' &&
        typeof body.expected_version === 'number' && Number.isInteger(body.expected_version)
        ? body.expected_version as number : null
      if (action === 'update_item' && (!expectedVersion || expectedVersion < 1)) {
        return fail('Version d’affaire manquante.', 400, origin)
      }
      const message = action === 'request_help' ? field(body, 'message')?.trim() : null
      if (action === 'request_help' && !message) return fail('Message d’aide manquant.', 400, origin)

      const { data, error } = await service.rpc('packquest_child_mutation', {
        p_device_hash: deviceHash,
        p_mutation_id: mutationId,
        p_action: action,
        p_mission_id: missionId,
        p_item_id: itemId,
        p_status: status,
        p_expected_version: expectedVersion,
        p_message: message,
      })
      if (error) return databaseError(error.code, origin)
      return json(action === 'update_item' || action === 'request_help'
        ? { item: data } : { mission: data }, 200, origin)
    }

    const authorization = request.headers.get('Authorization')
    const jwt = authorization?.match(/^Bearer (\S+)$/i)?.[1]
    if (!jwt) return fail('Connexion parent requise.', 401, origin)
    const { data: auth, error: authError } = await service.auth.getUser(jwt)
    if (authError || !auth.user) return fail('Connexion parent expirée.', 401, origin)
    const ownerId = auth.user.id

    if (action === 'create_child') {
      const name = field(body, 'name', 60)?.trim()
      if (!name) return fail('Prénom ou pseudonyme requis.', 400, origin)
      const { error: familyInsertError } = await service.from('families')
        .upsert({ owner_user_id: ownerId }, {
          onConflict: 'owner_user_id', ignoreDuplicates: true,
        })
      if (familyInsertError) return databaseError(familyInsertError.code, origin)
      const { data: family, error: familyError } = await service.from('families')
        .select('id').eq('owner_user_id', ownerId).single()
      if (familyError || !family) return databaseError(familyError?.code, origin)
      const { data, error } = await service.from('child_profiles')
        .insert({ family_id: family.id, name }).select('id,family_id,name,avatar_key,created_at,updated_at').single()
      if (error) return databaseError(error.code, origin)
      return json({ child: data }, 200, origin)
    }

    if (action === 'create_pairing') {
      const childId = uuid(body, 'child_id')
      if (!childId) return fail('Profil enfant invalide.', 400, origin)
      const token = newCapability()
      const { data, error } = await service.rpc('packquest_create_pairing', {
        p_owner_id: ownerId,
        p_child_id: childId,
        p_token_hash: await hash(token),
      })
      if (error) return databaseError(error.code, origin)
      return json({ token, expires_at: data }, 200, origin)
    }

    if (action === 'create_mission') {
      const childId = uuid(body, 'child_id')
      const templateId = uuid(body, 'template_id')
      if (!childId || !templateId) return fail('Profil ou modèle invalide.', 400, origin)
      const title = body.title === undefined ? null : field(body, 'title', 100)
      const period = body.period === undefined ? null : field(body, 'period', 80)
      if ((body.title !== undefined && title === null) ||
          (body.period !== undefined && period === null)) {
        return fail('Titre ou période trop longs.', 400, origin)
      }
      const { data, error } = await service.rpc('packquest_create_mission', {
        p_owner_id: ownerId, p_child_id: childId, p_template_id: templateId,
        p_title: title, p_period: period,
      })
      if (error) return databaseError(error.code, origin)
      return json({ mission: data }, 200, origin)
    }

    if (['send_mission', 'cancel_mission', 'reply_help', 'revoke_device'].includes(action)) {
      const missionId = action === 'revoke_device' ? null : uuid(body, 'mission_id')
      const deviceId = action === 'revoke_device' ? uuid(body, 'device_id') : null
      const itemId = action === 'reply_help' ? uuid(body, 'item_id') : null
      const response = action === 'reply_help' ? field(body, 'response')?.trim() : null
      if ((action === 'revoke_device' && !deviceId) ||
          (action !== 'revoke_device' && !missionId) ||
          (action === 'reply_help' && (!itemId || !response))) {
        return fail('Données de mission invalides.', 400, origin)
      }
      const { data, error } = await service.rpc('packquest_parent_mutation', {
        p_owner_id: ownerId, p_action: action, p_mission_id: missionId,
        p_item_id: itemId, p_response: response, p_device_id: deviceId,
      })
      if (error) return databaseError(error.code, origin)
      return json(action === 'reply_help' ? { item: data }
        : action === 'revoke_device' ? { device: data } : { mission: data }, 200, origin)
    }

    return fail('Action inconnue.', 400, origin)
  } catch {
    // Never log or reflect a raw pairing or device capability.
    return fail('Une erreur est survenue. Réessayez.', 500, origin)
  }
})
