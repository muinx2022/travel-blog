"use client";

import { EntityActions } from "./entity-actions";

type ActionProps = {
  targetType: string;
  targetDocumentId: string;
  targetTitle?: string;
};

export function PostActions({ targetType, targetDocumentId, targetTitle }: ActionProps) {
  return (
    <EntityActions
      targetType={targetType}
      targetDocumentId={targetDocumentId}
      targetTitle={targetTitle}
      allowLike
      allowFollow={targetType === "post"}
      allowContact={targetType !== "post"}
      allowReport
    />
  );
}
