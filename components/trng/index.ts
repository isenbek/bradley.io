/**
 * The TRNG client surface.
 *
 * This barrel used to re-export six presentational components as well. They
 * belonged to V3TrngDashboard, which the style-kit port replaced with
 * TrngBoard, and they went with it. What is left is the API, which three live
 * things read: TrngBoard, and the two modules behind /trng/space.
 *
 * Importers may equally use "@/components/trng/api" directly, and the newer
 * boards for sdr, fleet and dragonfli do exactly that. This barrel survives
 * only because those three call sites already point at it.
 */
export * from "./api"
