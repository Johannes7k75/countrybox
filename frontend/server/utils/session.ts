import {H3Event} from "h3"
import { deserialize, unsign } from '../lib/cookie';
import { findUserById } from '../lib/user';

export async function getUserFromSession(event: H3Event) {
  const config = useRuntimeConfig(event)
  
  const cookie = getCookie(event, config.cookieName)
  if (!cookie) return null;
  
  const unsignedSession = unsign(cookie, config.cookieSecret)
  if (!unsignedSession) return null
  
  const session = deserialize(unsignedSession)

  return findUserById(session.userId)
}