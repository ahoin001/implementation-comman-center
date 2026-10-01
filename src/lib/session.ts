/** Signed-in user id, set by the auth gate before data loads. */
let actorId: string | null = null

export function setActorId(id: string | null) {
  actorId = id
}

export function getActorId(): string {
  if (!actorId) throw new Error('Not signed in')
  return actorId
}
