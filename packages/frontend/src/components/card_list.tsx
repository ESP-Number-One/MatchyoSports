import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";

interface CardListProps<T extends ReactNode> {
  nextPage: (nextPage: number) => Promise<T[]>;
  startPage?: number;
}

export function CardList<T extends ReactNode>({
  nextPage,
  startPage,
}: CardListProps<T>) {
  const [pageNum, setPageNum] = useState(
    startPage !== undefined && startPage >= 0 ? startPage : 0,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLastPage, setIsLastPage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shouldGetPage, setShouldGetPage] = useState(true);
  const cards = useRef<T[]>([]);

  let y1: number;
  let y2: number;

  function refreshWrapper() {
    let newCards: T[] = [];
    setIsLoading(true);
    const promises = [...Array<number>(pageNum)].map((_, i) => {
      return nextPage(i);
    });

    Promise.all(promises)
      .then((results) => {
        for (const result of results) {
          if (result.length === 0) {
            setIsLastPage(true);
          }
          newCards = newCards.concat(result);
        }
        cards.current = newCards;
        setIsRefreshing(false);
        setIsLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setIsRefreshing(false);
      });
  }

  const touchStart = (e: TouchEvent) => {
    y1 = e.touches[0].pageY;
  };

  const touchMove = (e: TouchEvent) => {
    y2 = e.touches[0].pageY;
    if (
      document.scrollingElement?.scrollTop === 0 && // view is at top of screen
      y2 > y1 + 120 && // touch scrolled down by 120px
      !isLoading && // Don't update if already loading stuff
      !shouldGetPage // and don't update if already about to load stuff
    ) {
      setIsRefreshing(true);
      setIsLastPage(false);
      console.log("Refreshing messages");
    }
  };

  const touchEnd = (_e: TouchEvent) => {
    if (isRefreshing && !(isLoading || shouldGetPage)) {
      refreshWrapper();
    }
  };

  useEffect(() => {
    window.addEventListener("touchstart", touchStart, { passive: true });
    return () => {
      window.removeEventListener("touchstart", touchStart);
    };
  });

  useEffect(() => {
    window.addEventListener("touchmove", touchMove, { passive: true });
    return () => {
      window.removeEventListener("touchmove", touchMove);
    };
  });

  useEffect(() => {
    window.addEventListener("touchend", touchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchend", touchEnd);
    };
  });

  function nextPageWrapper() {
    setIsLoading(true);
    setPageNum(pageNum + 1);
    nextPage(pageNum)
      .then((result) => {
        console.log(`Made request for page ${pageNum}`);
        if (result.length === 0) {
          setIsLastPage(true);
        }
        cards.current = cards.current.concat(result);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }

  function handleScroll() {
    if (
      window.innerHeight + document.documentElement.scrollTop <
        document.documentElement.offsetHeight - 30 ||
      isLastPage ||
      isLoading ||
      shouldGetPage
    ) {
      return;
    }
    setShouldGetPage(true);
  }

  useEffect(() => {
    if (!isLoading && !isLastPage) {
      nextPageWrapper();
    }
    setShouldGetPage(false);
  }, [shouldGetPage]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });
  return (
    <div className="flex flex-col h-full m-1">
      <Icon
        className={
          isRefreshing || isLoading
            ? "translate-y-24 duration-300 bg-white p-4 rounded-full flex self-center -rotate-180 shadow"
            : "-translate-y-72 duration-300 bg-white p-4 rounded-full flex self-center rotate-180 shadow"
        }
        icon={faRefresh}
        size="lg"
      />
      {cards.current}
      {isLoading ? <p className="self-center font-body">Loading!</p> : null}
      {isLastPage ? (
        <p className="self-center font-body">No more results.</p>
      ) : null}
    </div>
  );
}
