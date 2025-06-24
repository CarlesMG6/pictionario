import ClientHostPage from './ClientHostPage';

export default function Page({ params }: { params: { id: string } }) {
  return <ClientHostPage id={params.id} />;
}
