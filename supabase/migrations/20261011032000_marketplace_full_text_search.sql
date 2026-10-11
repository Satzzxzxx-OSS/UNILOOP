-- Agreed first search layer: PostgreSQL FTS, not an external search service.
-- Plain-text queries use the same explicit configuration as stored documents.
-- Existing table RLS and authenticated SELECT grants continue to apply.
begin;
alter table public.listings add column search_document tsvector
generated always as (
  setweight(to_tsvector('simple'::regconfig,title),'A') ||
  setweight(to_tsvector('simple'::regconfig,description),'B')
) stored;
alter table public.rental_listings add column search_document tsvector
generated always as (
  setweight(to_tsvector('simple'::regconfig,title),'A') ||
  setweight(to_tsvector('simple'::regconfig,description),'B')
) stored;
create index listings_search_document_idx on public.listings using gin(search_document);
create index rental_listings_search_document_idx on public.rental_listings using gin(search_document);
comment on column public.listings.search_document is
  'Automatically maintained simple-language FTS over title and description; table RLS applies.';
comment on column public.rental_listings.search_document is
  'Automatically maintained simple-language FTS over title and description; table RLS applies.';
commit;
