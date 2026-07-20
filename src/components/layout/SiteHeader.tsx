import SiteHeaderV1 from "./SiteHeaderV1";
import { SiteHeaderV2 } from "./SiteHeaderV2";

export type HeaderVersion = "v1" | "v2";

export type SiteHeaderProps = {
  version?: HeaderVersion;
};

export const SiteHeader = ({ version = "v1" }: SiteHeaderProps) => {
  return version === "v2" ? <SiteHeaderV2 /> : <SiteHeaderV1 />;
};
