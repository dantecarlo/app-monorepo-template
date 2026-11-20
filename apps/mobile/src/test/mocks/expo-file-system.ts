// expo-file-system cannot load under the test environment: it loads
// expo-modules-core, which reads React Native's __DEV__ global.
// vitest.config.ts aliases the package to this stand-in, so every module
// that imports it loads. It is an empty document directory: a file there
// does not exist and deleting it throws, as on a device. A test that needs a
// file there spies on `File.prototype`, taken from the same module registry
// as the code it loads.

export class Directory {
  readonly uri: string

  constructor(uri: string) {
    this.uri = uri
  }
}

const DOCUMENT_DIRECTORY = new Directory('file:///document/')

export const Paths = {
  get document(): Directory {
    return DOCUMENT_DIRECTORY
  }
}

export class File {
  readonly name: string

  readonly parentDirectory: Directory

  // eslint-disable-next-line local/single-object-params -- expo-file-system's File takes (directory, name)
  constructor(directory: Directory, name: string) {
    this.parentDirectory = directory
    this.name = name
  }

  get exists(): boolean {
    return false
  }

  delete(): void {
    throw new Error(`${this.name} does not exist`)
  }
}
