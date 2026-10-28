// 회계 주석(numbers_comments.py 결과 json)에서 과일 거래내역을 단가 줄로 — 화면의 「거래내역 붙여 넣기」와 같은 parse(js/fruitprice.js)
//  사용: node fruit_lines.js comments.json 2026-10 > lines.json   (그 달 날짜 줄만 · 칠성 · 엄궁 · 쿠팡 · 네이버페이 과일 줄)
const { parse } = require("../js/fruitprice.js");
const [, , file, ym] = process.argv;
const o = require(require("path").resolve(file));
const out = [], seen = new Set();
for (const x of o) {
  if (!x.date || !/과일|칠성|엄궁|복숭아택배|쿠팡|네이버페이/.test(x.row || "")) continue;
  const y = +x.date.slice(0, 4), m = +x.date.slice(5, 7);
  for (const l of parse(x.cm || "", y, m)) {
    if (ym && l.d.slice(0, 7) !== ym) continue;
    const k = [l.d, l.f, l.p, l.q].join("|"); if (seen.has(k)) continue; seen.add(k);
    out.push({ ...l, src: "회계 주석 " + x.date });
  }
}
process.stdout.write(JSON.stringify(out));
