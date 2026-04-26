"use client";

import { useMemo } from "react";
import { useSetTopBar } from "@/components/layout/useSetTopBar";
import { useClient } from "@/lib/client-context";
import ClientTopBarLeft from "@/components/clients/ClientTopBarLeft";

export function useClientTopBar(pageLabel: string) {
  const { client } = useClient();

  const left = useMemo(
    () => <ClientTopBarLeft pageLabel={pageLabel} client={client} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageLabel, client]
  );

  useSetTopBar(left);
}
