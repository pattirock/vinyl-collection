export function Cover({ url, notes }: { url: string; notes: string }) {
  return (
    <div>
      <img src={url} />
      <p dangerouslySetInnerHTML={{ __html: notes }} />
    </div>
  );
}
