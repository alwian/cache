const consts = {
  missingKeysMessage: (missingKeys: string[]) =>
    `The following keys do not exist on the cache - ${missingKeys}`,
  duplicateKeysMessage: (duplicateKeys: string[]) =>
    `The following keys already exist in the cache - ${duplicateKeys}`
};

export default consts;
