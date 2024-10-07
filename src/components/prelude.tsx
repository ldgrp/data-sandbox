import type { Article } from "../types/article";

type PreludeType = {
    article: Article;
}

export const formatDate = ( day: number, month: number, year: number): string => {
    const date = new Date(year, month - 1, day);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-AU', options);
}

export function Prelude({ article }: PreludeType) {
    return (
        <>
            <div className="prelude">
                {formatDate(article.dateDay, article.dateMonth, article.dateYear)} | {article.type}
            </div>
            <h1>{article.title}</h1>
            <hr/>
        </>
    );
}