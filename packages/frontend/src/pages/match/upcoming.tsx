import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { ReactNode } from "react";
import { useCallback, useContext } from "react";
import { MatchStatus, hasId } from "@esp-group-one/types";
import { Page } from "../../components/page";
import { Header } from "../../components/page/header";
import { useAsync } from "../../lib/async";
import { API } from "../../state/auth";
import { MatchCard } from "../../components/card/match";
import { Link } from "../../components/link";
import { Feed } from "../../components/card/feed";

export function UpcomingMatch() {
  const api = useContext(API);

  const { ok, loading, error } = useAsync(async () => {
    const proposals = api.match().findProposed({ pageSize: 11 });
    const user = api.user().me();
    return { count: (await proposals).length, user: await user };
  })
    .catch((err) => <>{err.message}</>)
    .await();

  const nextPage = useCallback(
    async (pageStart: number) => {
      const matches = await api.match().find({
        query: { status: MatchStatus.Accepted },
        pageStart,
        sort: { date: 1 },
      });

      const ops = matches
        .map((m) => m.players)
        .flat()
        .filter((p) => ok && !p.equals(ok.user._id));

      const opponents = await api.user().find({ query: { _id: { $in: ops } } });

      return matches.map((m) => {
        const op = opponents.filter((o) => hasId(m.players, o._id));
        return (
          <MatchCard
            className="mt-2"
            key={m._id.toString()}
            match={m}
            opponent={op[0]}
          />
        );
      });
    },
    [api, ok],
  );

  if (!ok)
    return (
      <Page page="home">
        <Page.Header>Upcoming</Page.Header>
        <Page.Body>{(loading ?? error) as ReactNode}</Page.Body>
      </Page>
    );

  return (
    <Page page="home">
      <Page.Header>
        Upcoming
        <Header.Right>
          <Link href="/match/new" className="pr-2">
            <FontAwesomeIcon icon={faPlus} />
          </Link>
        </Header.Right>
      </Page.Header>
      <Page.Body flexCol spacing>
        {ok.count > 0 && (
          <Link
            className="text-2xl font-title text-white w-full"
            href="/match/proposals"
          >
            <div className="bg-p-grey-900 flex-none rounded-lg p-2 w-full flex place-content-center font-bold">
              <h2>{ok.count > 10 ? "10+" : ok.count} Proposed Matches</h2>
              <FontAwesomeIcon className="pl-3 pt-1" icon={faChevronRight} />
            </div>
          </Link>
        )}

        <div className="rounded-t-lg flex-1 overflow-y-scroll">
          <Feed nextPage={nextPage} />
        </div>
      </Page.Body>
    </Page>
  );
}
