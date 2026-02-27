import { useEffect } from 'react'

type DocumentMetaOptions = {
  title: string
  description?: string
}

function upsertMetaDescription(content: string) {
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null

  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'description'
    document.head.appendChild(meta)
  }

  meta.content = content
}

export default function useDocumentMeta({ title, description }: DocumentMetaOptions) {
  useEffect(() => {
    document.title = title

    if (description) {
      upsertMetaDescription(description)
    }
  }, [title, description])
}