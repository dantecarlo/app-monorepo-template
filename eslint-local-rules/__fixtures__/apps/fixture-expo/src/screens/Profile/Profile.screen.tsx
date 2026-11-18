export const Profile = ({ imageKey }: { imageKey: string }) => {
  const source = process.env[imageKey]
  return <img alt="profile" src={source} />
}
