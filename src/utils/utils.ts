import consts from "../consts";

export const checkMissingKeys = (validKeys: any[], desiredKeys: any[]) => {
  const missing = desiredKeys.filter((key: string) => !validKeys.includes(key));

  if (missing.length) throw Error(consts.missingKeysMessage(missing));
};

export const checkDuplicateKeys = (currentKeys: any[], desiredKeys: any[]) => {
  const duplicates = desiredKeys.filter((key: string) =>
    currentKeys.includes(key)
  );

  if (duplicates.length) throw Error(consts.duplicateKeysMessage(duplicates));
};
