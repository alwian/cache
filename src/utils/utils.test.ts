import { checkDuplicateKeys, checkMissingKeys } from "./utils";

describe("utils tests", () => {
  describe("checkMissingKeys tests", () => {
    it("Can return missing keys", () => {
      expect(() => checkMissingKeys(["a", "b"], ["c"])).toThrowError(
        "The following keys do not exist on the cache - c"
      );
    });
  });

  describe("checkDuplicateKeys tests", () => {
    it("Can return duplicate keys", () => {
      expect(() => checkDuplicateKeys(["a", "b"], ["b"])).toThrowError(
        "The following keys already exist in the cache - b"
      );
    });
  });
});
