export type InvitationPreviewStatus =
  | "valid"
  | "expired"
  | "revoked"
  | "used"
  | "invalid"
  | "rate_limited"
  | "pet_unavailable"

export type InvitationPreview = {
  status: InvitationPreviewStatus
  pet_name: string | null
  owner_display_name: string | null
  expires_at: string | null
  pet_has_co_parent: boolean | null
  viewer_is_caregiver: boolean | null
  viewer_is_owner: boolean | null
}

export type CreateInvitationResult = {
  invitation_id: string
  invite_token: string | null
  invite_code: string | null
  expires_at: string
  pet_name: string
  replayed: boolean
}

export type AcceptInvitationOutcome =
  | "accepted"
  | "used"
  | "revoked"
  | "expired"
  | "invalid"
  | "rate_limited"
  | "self_owner"
  | "already_caregiver"
  | "pet_full"
  | "pet_unavailable"

export type AcceptInvitationResult = {
  outcome: AcceptInvitationOutcome
  pet_id: string | null
  server_now: string
}

export type CoParentState = {
  viewer_role: "owner" | "co_parent" | null
  owner_display_name: string | null
  co_parent_display_name: string | null
  co_parent_avatar_url: string | null
  has_co_parent: boolean
  pending_expires_at: string | null
}
