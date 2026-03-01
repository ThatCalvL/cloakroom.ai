import { bootstrapUser } from "@/lib/api";

const OWNER_ID_KEY = "cloakroom_owner_id";
const OWNER_EMAIL_KEY = "cloakroom_owner_email";

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function getOrBootstrapOwnerId(): Promise<number> {
  const cached = window.localStorage.getItem(OWNER_ID_KEY);
  if (cached) {
    const id = Number(cached);
    if (Number.isInteger(id) && id > 0) {
      return id;
    }
  }

  const cachedEmail = window.localStorage.getItem(OWNER_EMAIL_KEY);
  const email = cachedEmail ?? `web-mvp-${randomSuffix()}@cloakroom.ai`;

  const user = await bootstrapUser(email, "Web MVP User");
  window.localStorage.setItem(OWNER_ID_KEY, String(user.id));
  window.localStorage.setItem(OWNER_EMAIL_KEY, user.email);
  return user.id;
}

export function clearOwnerSession(): void {
  window.localStorage.removeItem(OWNER_ID_KEY);
  window.localStorage.removeItem(OWNER_EMAIL_KEY);
}
