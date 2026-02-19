declare module "@/lib/build-info.json" {
  const buildInfo: {
    version: string
    commitHash: string
    commitHashFull: string
    commitDate: string
    commitDateISO: string
    branch: string
    buildTime: string
  }
  export default buildInfo
}
