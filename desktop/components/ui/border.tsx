export function Border() {
  return (
    <>
      <figure className="absolute top-0 left-0 z-11 size-1 origin-top-left -translate-x-1/2 -translate-y-1/2 bg-white/80" />
      <figure className="absolute top-0 right-0 z-11 size-1 origin-top-right translate-x-1/2 -translate-y-1/2 bg-white/80" />
      <figure className="translate-y/1/2 absolute right-0 bottom-0 z-11 size-1 origin-bottom-right translate-x-1/2 translate-y-1/2 bg-white/80" />
      <figure className="absolute bottom-0 left-0 z-11 size-1 origin-bottom-left -translate-x-1/2 translate-y-1/2 bg-white/80" />
    </>
  );
}
