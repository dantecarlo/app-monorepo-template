interface GreetingOptions {
  name: string
}

export const greet = ({ name }: GreetingOptions) => `Hello, ${name}`
