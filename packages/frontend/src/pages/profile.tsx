import {
  ObjectId,
  calculateAverageRating,
  makeImgSrc,
} from "@esp-group-one/types";
import { useParams } from "react-router-dom";
import type { ReactNode } from "react";
import { useCallback, useContext } from "react";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Stars } from "../components/stars";
import { Page } from "../components/page";
import { ProfilePic } from "../components/profile_pic.tsx";
import { API } from "../state/auth.ts";
import { useAsync } from "../lib/async.tsx";
import { Tag } from "../components/tags.tsx";
import { Button } from "../components/button.tsx";
import { Link } from "../components/link.tsx";
import { useViewNav } from "../state/nav.ts";
import { BackLink } from "../components/back_link.tsx";
import { Feed } from "../components/card/feed.tsx";

export function ProfilePage() {
  const api = useContext(API);
  const { id } = useParams();
  const viewNav = useViewNav();

  const { loading, error, ok } = useAsync(async () => {
    if (!id) throw new Error("No user id provided.");
    const objId = new ObjectId(id);

    const user = api.user().getId(objId);

    return { user: await user };
  })
    .catch((err) => <>{err.message}</>)
    .await();

  const nextPage = useCallback(
    async (pageStart: number) => {
      const matches = await api
        .match()
        .find({ query: { players: ok?.user._id }, pageStart });
      return matches.map((m) => {
        return (
          <Link
            className="w-full"
            href={`/match/${m._id.toString()}`}
            key={m._id.toString()}
          >
            <div className="w-full mt-2 rounded-lg bg-p-grey-200 flex p-3 place-items-center">
              <div className="flex-none justify-start">
                <Tag sportName={m.sport} />
              </div>
              <div className="flex-1 text-right font-body text-xl text-white font-bold">
                {moment(m.date).format("DD/MM HH:MM")}
              </div>
            </div>
          </Link>
        );
      });
    },
    [api, ok],
  );

  if (!ok)
    return (
      <Page>
        <Page.Body>{(loading ?? error) as ReactNode}</Page.Body>
      </Page>
    );

  const rating = calculateAverageRating(ok.user.rating);

  return (
    <Page>
      <Page.Header padding={false}>
        <div className="text-lg w-full">
          <ProfilePic
            image={makeImgSrc(ok.user.profilePicture)}
            sports={ok.user.sports}
          />
        </div>
        <div className="absolute top-0 left-0 p-2">
          <BackLink className="text-white front-bold" defaultLink="/search" />
        </div>
      </Page.Header>
      <Page.Body className="text-p-grey-900" scrollable>
        <p className={"text-right font-title pt-2 text-3xl font-bold"}>
          {ok.user.name}
        </p>
        <div className={"flex justify-end"}>
          <Stars rating={rating} disabled={true} size={"lg"} />
        </div>
        <p className={"py-2 px-3 text-center"}>{ok.user.description}</p>
        <Button
          icon={<FontAwesomeIcon icon={faPlus} />}
          backgroundColor="bg-p-grey-200"
          onClick={() => {
            viewNav(`/match/new?to=${id}`);
          }}
        >
          Propose
        </Button>
        <div className="mb-2">
          <Feed nextPage={nextPage} />
        </div>
      </Page.Body>
    </Page>
  );
}
