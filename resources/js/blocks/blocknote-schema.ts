import { BlockNoteSchema } from '@blocknote/core';
import { defaultBlockSpecs } from '@blocknote/core';
import { ReactVideoBlock } from '@blocknote/react';
import { ReactEmbedBlock } from '@/blocks/specs/EmbedBlock';

// Compose a schema that includes defaults plus our custom React blocks
export const createDocsBlockNoteSchema = () =>
  BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      // Use BlockNote's React video spec to ensure native rendering
      video: ReactVideoBlock(),
      // Add our custom embed block
      embed: ReactEmbedBlock(),
    },
  });
