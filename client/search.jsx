import React from "react";
import { render } from "react-dom";

async function main() {
  const oof = await fetch("https://jsonplaceholder.typicode.com/todos/1");
  const body = await oof.json();
  console.log(body);
  render(<div>aaa</div>, document.querySelector("#root"));
}
main();

console.log("aaa");
console.log(window.location.search);
const eLocation = new URL(window.location);
console.log(eLocation.searchParams.get("q"));
