import assert from "node:assert/strict"
import { googleSignupPolicyFields } from "../lib/google-oauth-policy"

assert.deepEqual(googleSignupPolicyFields(null), {}, "Missing OAuth state must not grant consent")
assert.deepEqual(
    googleSignupPolicyFields({ requestSignUp: false, policyAccepted: true }),
    {},
    "A normal Google sign-in must not masquerade as policy-accepted sign-up",
)
assert.deepEqual(
    googleSignupPolicyFields({ requestSignUp: true, policyAccepted: false }),
    {},
    "A rejected policy must not allow Google sign-up",
)
assert.deepEqual(
    googleSignupPolicyFields({ requestSignUp: true, policyAccepted: true }),
    { policyAccepted: true },
    "Explicit policy acceptance must be passed to new-user creation",
)

console.log("Google OAuth consent checks passed")
