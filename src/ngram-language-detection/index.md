---
title: N-Gram Based Language Detection in JavaScript
head: |
  <meta name="description" content="A toy implementation of a Naive Bayes classifier
  for language detection using N-grams in JavaScript."/>
---

```tsx
import { languagedetectionArticle as article } from "../article-manifest.js";
import { Prelude } from "../components/prelude.js";
display(<Prelude article={article}/>)
```

```js
const textarea = view(Inputs.textarea({ label: "Document", value: "Hello world" }))
```

The detected language is **${detectLanguage(textarea).englishName}**.

```js
const data = Array.from(classifier.predictDetailed(textarea)).flatMap(
  ([
    x,
    { probability, bigramProbability, trigramProbability, quadgramProbability }
  ]) => {
    const lang = `${languages.find((l) => l.code === x).englishName} (${x})`;
    return [
      {
        lang,
        score: bigramProbability,
        total: probability,
        type: "bigram"
      },
      {
        lang,
        score: trigramProbability,
        total: probability,
        type: "trigram"
      },
      {
        lang,
        score: quadgramProbability,
        total: probability,
        type: "quadgram"
      }
    ];
  }
)
```

```js
Plot.plot({
  width: width,
  marginLeft: 200,
  marks: [
    Plot.barX(data, {
      y: "lang",
      x: "total",
      fill: "type",
      tip: true,
      sort: {y: "-x"}
    })
  ]
})
```

## Implementation

```js echo
class NGram {
  constructor(n) {
    this.n = n;
    this.freqMap = new Map();
  }

  generate(text) {
    text = text.toLowerCase().replace(/\n/g, "");
    let gram = " ".repeat(this.n);
    this.addGram(gram);
    for (let i = 0; i < text.length; i++) {
      gram = gram.slice(1) + text[i];
      this.addGram(gram);
    }
  }

  addGram(gram) {
    const freq = this.freqMap.get(gram) ?? 0;
    this.freqMap.set(gram, freq + 1);
  }

  getFrequencies() {
    return this.freqMap;
  }

  getTopFrequencies(k) {
    return new Map(
      Array.from(this.freqMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, k)
    );
  }
}
```

```js echo
class NaiveBayes {
  constructor() {
    this.classes = new Map();
    this.k = 300;
  }

  _getTopKNGrams(text, n) {
    const ngram = new NGram(n);
    ngram.generate(text);
    return ngram.getTopFrequencies(this.k);
  }

  _getProfile(text) {
    return {
      bigrams: this._getTopKNGrams(text, 2),
      trigrams: this._getTopKNGrams(text, 3),
      quadgrams: this._getTopKNGrams(text, 4)
    };
  }

  train(text, label) {
    this.classes.set(label, this._getProfile(text));
  }

  _calculateClassProbability(textNGrams, classNGrams, n) {
    let classProbability = 0;

    for (const [ngram, count] of textNGrams.entries()) {
      const classCount = classNGrams.get(ngram) || 0;
      classProbability += Math.log2(
        (classCount + 1) / (classNGrams.size + Math.pow(2, n))
      );
    }
    return classProbability;
  }

  predict(text) {
    const {
      bigrams: textBigrams,
      trigrams: textTrigrams,
      quadgrams: textQuadgrams
    } = this._getProfile(text);

    const classProbabilities = new Map();
    for (const [
      className,
      {
        bigrams: classBigrams,
        trigrams: classTrigrams,
        quadgrams: classQuadgrams
      }
    ] of this.classes) {
      let classProbability = Math.log2(this.getClassPrior(className));

      classProbability += this._calculateClassProbability(
        textBigrams,
        classBigrams,
        2
      );
      classProbability += this._calculateClassProbability(
        textTrigrams,
        classTrigrams,
        3
      );
      classProbability += this._calculateClassProbability(
        textQuadgrams,
        classQuadgrams,
        4
      );

      classProbabilities.set(className, classProbability);
    }

    const predictedClass = _.maxBy(
      Array.from(classProbabilities),
      ([className, probability]) => probability
    );
    return predictedClass;
  }
  predictDetailed(text) {
    const {
      bigrams: textBigrams,
      trigrams: textTrigrams,
      quadgrams: textQuadgrams
    } = this._getProfile(text);

    const classProbabilities = new Map();
    for (const [
      className,
      {
        bigrams: classBigrams,
        trigrams: classTrigrams,
        quadgrams: classQuadgrams
      }
    ] of this.classes) {
      let classProbability = Math.log2(this.getClassPrior(className));

      const bigramProbability = this._calculateClassProbability(
        textBigrams,
        classBigrams,
        2
      );
      const trigramProbability = this._calculateClassProbability(
        textTrigrams,
        classTrigrams,
        3
      );
      const quadgramProbability = this._calculateClassProbability(
        textQuadgrams,
        classQuadgrams,
        4
      );

      classProbability +=
        bigramProbability + trigramProbability + quadgramProbability;

      classProbabilities.set(className, {
        probability: classProbability,
        bigramProbability,
        trigramProbability,
        quadgramProbability
      });
    }

    return classProbabilities;
  }
  getClassPrior(className) {
    const classCount = this.classes.size;
    return (this.classes.has(className) ? 1 : 0) / classCount;
  }
}
```

```js echo
const classifier = new NaiveBayes();
languages.forEach(({ code, text }) => classifier.train(text, code));
```

```js echo
const detectLanguage = (text) =>
  languages.find((l) => l.code === classifier.predict(text)?.[0]);
```

```jsx
import { languages } from "./language.js";
```

### References

- [N-Gram-Based Text Categorization](https://www.researchgate.net/publication/2375544_N-Gram-Based_Text_Categorization)