import React from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { useContext } from "./index";

type NavLinkProps = {
  active?: boolean;
};

const NavLink = styled.a<NavLinkProps>`
  ${tw`inline-block text-lg py-2 leading-none border p-2 text-white border-white hover:(border-transparent text-gray-400 bg-gray-100)`};
  ${(props) =>
    props.active &&
    tw`border-transparent text-gray-800 bg-white hover:(border-transparent text-gray-500 bg-white)`}
`;

const SearchInput = tw.input`bg-gray-800 text-lg py-2 leading-none border p-2 text-white border-white grid-column[auto / span 3]`;
const SearchButton = tw.button`bg-gray-800 text-lg py-2 leading-none border p-2 text-white border-white`;

export function NavBar() {
  const { data } = useContext();
  const nav = (data?.collections?.mdxNav ?? []).sort((a, b) =>
    a.order < b.order ? -1 : 1
  );

  return (
    <>
      <nav tw="grid grid-cols-3 md:grid-cols-5 gap-2 bg-gray-800 p-6">
        {nav.map((p) => (
          <NavLink key={p.key} active={p.url === data.page.url} href={p.url}>
            {p.key}
          </NavLink>
        ))}
        <NavLink tw="sr-only" className="skip-link" href={"#main"}>
          Skip to main
        </NavLink>
        <form
          method="get"
          target="_self"
          action="/search"
          tw="grid grid-cols-4 grid-column[auto / span 3] md:grid-column[auto / span 2]"
        >
          <SearchInput name="q" type="text" placeholder="Search..." />
          <SearchButton>🔍</SearchButton>
        </form>
      </nav>
    </>
  );
}
