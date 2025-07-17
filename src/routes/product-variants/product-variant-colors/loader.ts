import { LoaderFunction } from "react-router-dom"

export const loader: LoaderFunction = async () => {
  return { ok: true }
}
