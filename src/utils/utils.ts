import consts from "../consts/consts";

export const checkMissingKeys = (
  validKeys: string[],
  desiredKeys: string[]
) => {
  const missing = desiredKeys.filter((key: string) => !validKeys.includes(key));

  if (missing.length) throw Error(consts.missingKeysMessage(missing));
};

export const checkDuplicateKeys = (
  currentKeys: string[],
  desiredKeys: string[]
) => {
  const duplicates = desiredKeys.filter((key: string) =>
    currentKeys.includes(key)
  );

  if (duplicates.length) throw Error(consts.duplicateKeysMessage(duplicates));
};
