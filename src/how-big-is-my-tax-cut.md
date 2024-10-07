---
title: How big is my tax cut?
---

```tsx
import { taxcutArticle } from "./article-manifest.js";
import { Prelude } from "./components/prelude.js";
display(<Prelude article={taxcutArticle}/>)
```

```js
const myIncome = view(Inputs.range([0, 250000], {
  label: "Income (A$)",
  type: "number",
  value: 65000,
  step: 1000
}))
```

A person on **${formatter.format(myIncome)}** of income will receive a tax cut of **${formatter.format(Math.abs(myIncome_delta))}**. Their tax liability for the 2022-23 financial year is **${formatter.format(myIncome_stage2)}** and will be decreased to **${formatter.format(myIncome_stage3)}** after the stage three tax cuts (not including offsets and the Medicare levy).

## Stage Three Tax Cuts

From 1 July 2024, the 32.5% tax bracket will be dropped to 30% and the 37% bracket is removed, such that the *marginal tax rate* on incomes between $45,000 and $200,000 will be 30%. The threshold above which the top bracket of 45% applies will be increased from $180,000 to $200,000.

```js
Plot.plot({
  x: {
    grid: true,
    tickFormat: "$s",
    label: "Income (A$) →"
  },
  y: { grid: true, label: "↑ Marginal tax rate" },
  color: {
    legend: true,
    domain: ["Stage Two (2022-23)", "Stage Three (2024-25)"]
  },
  marks: [
    Plot.line(data, {
      x: "income",
      y: "marginalTaxRate",
      stroke: "name",
      strokeWidth: 2
    })
  ]
})
```

The graph below shows the tax liability of an individual as a percentage of their income. This is known as _effective tax rate_.

```js
Plot.plot({
  x: {
    grid: true,
    tickFormat: "$s",
    label: "Income (A$)  →"
  },
  y: { grid: true, label: "↑ Effective tax rate" },
  color: {
    legend: true,
    domain: ["Stage Two (2022-23)", "Stage Three (2024-25)"]
  },
  marks: [
    Plot.line(data, {
      x: "income",
      y: "effectiveTaxRate",
      stroke: "name",
      strokeWidth: 2
    }),
    Plot.dot(
      [
        {
          x: myIncomeEff,
          y: myIncomeEff_stage2,
          policy: "Stage Two (2022-23)"
        },
        {
          x: myIncomeEff,
          y: myIncomeEff_stage3,
          policy: "Stage Three (2024-25)"
        }
      ],
      {
        x: "x",
        y: "y",
        title: ({ x, y }) =>
          `Income: ${formatter.format(x)}\nEffective tax rate: ${round(
            y * 100
          )}%`,
        stroke: "policy",
        strokeWidth: 2,
        fill: "white",
        tip: true,
      }
    )
  ]
})
```

```js
const myIncomeEff = view(Inputs.range([0, 220000], {
  label: "Income (A$)",
  step: 1000,
  value: 80000
}))
```

A person on **${formatter.format(myIncomeEff)}** will currently pay **${round(myIncomeEff_stage2*100)}%** of their income as tax. Under stage three, this will be reduced to **${round(myIncomeEff_stage3*100)}%**. This represents a **${round(myIncomeEff_delta * 100)}%** reduction valued at **${formatter.format(myIncomeEff_delta * myIncomeEff)}**.

Notice that Stage Three has no effect on anyone earning below $45,000 and produces greater tax reductions on higher income earners. After $200,000, the maximum tax cut available is reached at $9,075.

The graph below shows the tax reduction received at various income levels, along with annualised median incomes from the Australian Bureau of Statistics.


```js
Plot.plot({
  x: {
    grid: true,
    tickFormat: "$s",
    label: "Income (A$) →"
  },
  y: { grid: true, tickFormat: "$s", label: "↑ Tax cut (A$)" },
  color: { legend: true },
  marks: [
    Plot.line(
      data,
      Plot.groupX(
        { y: ([_, _1, _2, a, b]) => a.taxPayable - b.taxPayable },
        {
          x: "income"
        }
      )
    ),
    Plot.dot(median_earnings, {
      x: "income",
      y: "tax_delta",
      title: (d) =>
        `${d.occupation}\n Annualised Median Income: ${formatter.format(
          d.income
        )}\n Tax Cut: A${formatter.format(Math.abs(d.tax_delta))}`,
      fill: "white",
      stroke: "black",
      tip: true,
    })
  ]
})
```

```js
Inputs.table(median_earnings, {
  columns: [
    "occupation",
    "income",
    "tax_stage2",
    "tax_stage3",
    "tax_delta"
  ],
  header: {
    "occupation": "Occupation",
    "income": "Median Income",
    "tax_stage2": "Income tax (Current)",
    "tax_stage3": "Income tax (Stage Three)",
    "tax_delta": "Tax Cut",
  },
  format: {
    "income": (d) => formatter.format(d),
    "tax_stage2": (d) => formatter.format(d),
    "tax_stage3": (d) => formatter.format(d),
    "tax_delta": (d) => formatter.format(d)
  },
  select: false,
  layout: 'auto',
})
```

## Lower and Middle Income Tax Offset Phase-out
The Personal Income Tax Plan (PITP) was introduced in the 2018-19 Budget and comprises three stages:

- **Stage one** increases the threshold above which the 37% marginal rate applies from $87,000 to $90,000
  and introduces the *low and middle income tax offset* (LMITO)
- **Stage two** increases the threshold above which the 37% marginal rate applies from $90,000 to $120,000
  and increases the existing *low income tax offset* (LITO). The LMITO was planned to be abolished since these changes "lock in" the tax reductions.
- **Stage three** combines the 32.5% and 37% brackets into a single 30% bracket that applies to taxable income between $45,000 and $200,000. Income over $200,000 is taxed at a 45% marginal rate.

As an economic stimulus measure, the LMITO was extended in 2020-21 and 2021-22 resulting in an additional tax reduction. The LMITO was also increased by $420 for the 2021-22 income year.


```js
Plot.plot({
  x: {
    grid: true,
    tickFormat: "$s",
    label: "Income (A$) →",
    domain: [0, 126000]
  },
  y: {
    grid: true,
    tickFormat: "$s",
    label: "↑ Lower and middle income tax offset (A$)"
  },
  color: {
    legend: true
  },
  marks: [
    Plot.line(
      data.filter(
        (x) =>
          (x.name === "Stage Two (2020-21)" ||
            x.name === "Stage Two (2021-22)" ||
            x.name === "Stage Two (2022-23)") &&
          x.income <= 126001
      ),
      {
        x: "income",
        y: "lmitoOffset",
        stroke: "name"
      }
    ),
    Plot.dot(
      [
        {
          x: myIncomeOffset,
          y: myIncomeOffset_stage2_2020_21.lmitoOffset,
          name: "Stage Two (2020-21)"
        },
        {
          x: myIncomeOffset,
          y: myIncomeOffset_stage2_2021_22.lmitoOffset,
          name: "Stage Two (2021-22)"
        },
        {
          x: myIncomeOffset,
          y: myIncomeOffset_stage2_2022_23.lmitoOffset,
          name: "Stage Two (2022-23)"
        }
      ],
      {
        x: "x",
        y: "y",
        stroke: "name",
        fill: "white",
        strokeWidth: 2,
        title: ({ x, y }) =>
          `Income: ${formatter.format(x)}\nLMITO: ${formatter.format(y)}`
      }
    )
  ]
})
```

The LMITO has been phased out and will not be available in the 2022-23 income year. This means that, all other things being equal, some people will see an *increase* in their tax bill when compared between 2021-22 and 2022-23 income year.

```js
const myIncomeOffset = view(Inputs.range([0, 150000], {
  label: "Income (A$)",
  step: 1000,
  value: 60000
}))
```

A person on **${formatter.format(myIncomeOffset)}** will pay **${formatter.format(delta_lmito)}** more in the 2022-23 income year as a result of the Low and Middle Income Tax Offset phase out.


```js
const myIncome_stage2 = calculateTax(stage2, myIncome)

const myIncome_stage3 = calculateTax(stage3, myIncome)

const myIncome_delta = myIncome_stage3 - myIncome_stage2

const myIncome_lito = calculateOffset(lito, myIncome)

const myIncomeEff_stage2 = effectiveTaxRate(stage2, myIncomeEff)

const myIncomeEff_stage3 = effectiveTaxRate(stage3, myIncomeEff)

const myIncomeEff_delta = myIncomeEff_stage2 - myIncomeEff_stage3

const myIncomeOffset_stage2_2020_21 = calculateTaxWithOffset(
  stage2,
  lito,
  lmito,
  myIncomeOffset
)

const myIncomeOffset_stage2_2021_22 = calculateTaxWithOffset(
  stage2,
  lito,
  lmito22,
  myIncomeOffset
)
const myIncomeOffset_stage2_2022_23 = calculateTaxWithOffset(
  stage2,
  lito,
  null,
  myIncomeOffset
)

const delta_lmito = myIncomeOffset_stage2_2022_23.totalTaxPayable -
  myIncomeOffset_stage2_2021_22.totalTaxPayable
```

```js
const population = 13753200
const stage1 = [
  { lo: 0, hi: 18200, tax_rate: 0 },
  { lo: 18200, hi: 37000, tax_rate: 0.19 },
  { lo: 37000, hi: 90000, tax_rate: 0.325 },
  { lo: 90000, hi: 180000, tax_rate: 0.37 },
  { lo: 180000, hi: Number.POSITIVE_INFINITY, tax_rate: 0.45 }
].map((x) => ({ ...x, title: getTitle(x) }))
const stage2 = [
  { lo: 0, hi: 18200, tax_rate: 0 },
  { lo: 18200, hi: 45000, tax_rate: 0.19 },
  { lo: 45000, hi: 120000, tax_rate: 0.325 },
  { lo: 120000, hi: 180000, tax_rate: 0.37 },
  { lo: 180000, hi: Number.POSITIVE_INFINITY, tax_rate: 0.45 }
].map((x) => ({ ...x, title: getTitle(x) }))
const stage3 = [
  { lo: 0, hi: 18200, tax_rate: 0 },
  { lo: 18200, hi: 45000, tax_rate: 0.19 },
  { lo: 45000, hi: 200000, tax_rate: 0.3 },
  { lo: 200000, hi: Number.POSITIVE_INFINITY, tax_rate: 0.45 }
].map((x) => ({ ...x, title: getTitle(x) }))
const lito18 = [
  { lo: 0, hi: 37000, offset: (x) => 445 },
  { lo: 37000, hi: 66667, offset: (x) => -0.015 * x }
].map((x) => ({ ...x, title: getTitle(x) }))
const lito = [
  { lo: 0, hi: 37500, offset: (x) => 700 },
  { lo: 37500, hi: 45000, offset: (x) => - 0.05 * x },
  { lo: 45000, hi: 66667, offset: (x) => - 0.015 * x }
].map((x) => ({ ...x, title: getTitle(x) }))
const lmito = [
  { lo: 0, hi: 37000, offset: (x) => 255 },
  { lo: 37000, hi: 48000, offset: (x) => 0.075 * x },
  { lo: 48000, hi: 90000, offset: (x) => 0 },
  { lo: 90000, hi: 126000, offset: (x) => -0.03 * x }
].map((x) => ({ ...x, title: getTitle(x) }))
```

```js
const lmito22 = [
  { lo: 0, hi: 37000, offset: (x) => 675 },
  { lo: 37000, hi: 48000, offset: (x) => 0.075 * x },
  { lo: 48000, hi: 90000, offset: (x) => 0 },
  { lo: 90000, hi: 126000, offset: (x) => -0.03 * x },
  { lo: 126000, hi: Infinity, offset: (x) => -420 }
].map((x) => ({ ...x, title: getTitle(x) }))
```

```js
// From ABS https://www.abs.gov.au/statistics/labour/earnings-and-working-conditions/employee-earnings/aug-2022#occupation
const median_earnings = [
  { occupation: "Managers", income: 1900 * 52 },
  { occupation: "Professionals", income: 1692.9 * 52 },
  { occupation: "Technicians and trades workers", income: 1300 * 52 },
  { occupation: "Machinery operators and drivers", income: 1250 * 52 },
  { occupation: "Clerical and administrative workers", income: 1150 * 52 },
  { occupation: "Community and personal service workers", income: 863 * 52 },
  { occupation: "Labourers", income: 810 * 52 },
  { occupation: "Sales workers", income: 675.9 * 52 }
].map((d) => {
  const tax_stage2 = calculateTax(stage2, d.income);
  const tax_stage3 = calculateTax(stage3, d.income);
  const tax_delta = tax_stage2 - tax_stage3;
  return { ...d, tax_stage2, tax_stage3, tax_delta };
})
```

```js
const formatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0
})
```

```js
const nf = new Intl.NumberFormat("en-AU")
```

```js
const round = (n, decimals = 2) =>
  Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)
```

```js
const sum = (arr) => arr.reduce((x, cum) => x + cum, 0)
```

```js
const getTitle = ({ lo, hi }) => {
  if (lo === 0) return `${formatter.format(hi)} or less`;
  else if (!Number.isFinite(hi)) return `${formatter.format(lo+1)} or more`;
  else return `${formatter.format(lo + 1)} - ${formatter.format(hi)}`;
}
```

```js
const calculateTax = (policy, income) => {
  let result = 0;
  for (const bracket of policy) {
    if (bracket.lo <= income && bracket.hi <= income) {
      result += (bracket.hi - bracket.lo) * bracket.tax_rate;
    } else if (bracket.lo <= income && income <= bracket.hi) {
      result += (income - bracket.lo) * bracket.tax_rate;
    }
  }
  return result;
}
```

```js
const calculateOffset = (policy, income) => {
  let result = 0;
  for (const bracket of policy) {
    if (bracket.lo <= income && bracket.hi <= income) {
      result += bracket.offset(bracket.hi - bracket.lo);
    } else if (bracket.lo < income && income <= bracket.hi) {
      result += bracket.offset(income - bracket.lo);
    }
  }
  return round(result);
}
```

```js
const calculateTaxWithOffset = (taxPolicy, litoPolicy, lmitoPolicy, income) => {
  const litoOffset = litoPolicy ? calculateOffset(litoPolicy, income) : 0;
  const lmitoOffset = lmitoPolicy ? calculateOffset(lmitoPolicy, income) : 0;
  const taxPayable = calculateTax(taxPolicy, income);
  const totalOffset = litoOffset + lmitoOffset;
  const totalTaxPayable = Math.max(taxPayable - totalOffset, 0);
  return {
    taxPayable, // before offsets
    effectiveTaxRate: effectiveTaxRate(taxPolicy, income),
    marginalTaxRate: marginalTaxRate(taxPolicy, income),
    litoOffset,
    lmitoOffset,
    totalOffset,
    totalTaxPayable
  };
}
```

```js
const marginalTaxRate = (policy, n) =>
  calculateTax(policy, n + 1) - calculateTax(policy, n)
```

```js
const effectiveTaxRate = (policy, n) => (n > 0 ? calculateTax(policy, n) / n : 0)
```

```js
const taxRateByDollar = (
  taxPolicy,
  litoPolicy,
  lmitoPolicy,
  from,
  to,
  interval = 1
) => {
  const result = [];
  for (let income = from; income <= to; income += interval) {
    const taxDetails = calculateTaxWithOffset(
      taxPolicy,
      litoPolicy,
      lmitoPolicy,
      income
    );
    result.push({ ...taxDetails, income });
  }
  return result;
}
```

```js
const from = 1;
const to = 220000;
const interval = 500;
const data = [
  ["Stage One", taxRateByDollar(stage1, lito18, lmito, from, to, interval)],
  [
    "Stage Two (2020-21)",
    taxRateByDollar(stage2, lito, lmito, from, to, interval)
  ],
  [
    "Stage Two (2021-22)",
    taxRateByDollar(stage2, lito, lmito22, from, to, interval)
  ],
  [
    "Stage Two (2022-23)",
    taxRateByDollar(stage2, lito, null, from, to, interval)
  ],
  [
    "Stage Three (2024-25)",
    taxRateByDollar(stage3, lito, null, from, to, interval)
  ]
].flatMap(([name, d]) => d.map((d) => ({ name, ...d })));
```
