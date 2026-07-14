-- Store provider-editable Listing Detail presentation fields that do not belong
-- to the fixed category detail hub tables.
ALTER TABLE listings
    ADD COLUMN details_extra JSON NULL AFTER currency;
