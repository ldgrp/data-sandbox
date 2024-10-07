export type Article = {
    title: string;
    dateYear: string;
    dateMonth: string;
    dateDay: string;
    type: ArticleType;
}

export type ArticleType = 'Post';