export type GoogleOAuthPolicyState = {
    requestSignUp?: unknown
    policyAccepted?: unknown
} | null | undefined

/**
 * Only a deliberate Google sign-up request with explicit consent may supply
 * the required policyAccepted field when Better Auth creates a new user.
 */
export function googleSignupPolicyFields(state: GoogleOAuthPolicyState) {
    if (state?.requestSignUp === true && state.policyAccepted === true) {
        return { policyAccepted: true as const }
    }

    return {}
}
