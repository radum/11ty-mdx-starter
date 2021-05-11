import React from "react";
import styled from "styled-components";
import tw from "twin.macro";
import { useContext } from "./index";

type NavLinkProps = {
  active?: boolean;
};

const NavLink = styled.a<NavLinkProps>`
  ${tw`inline-block text-sm px-4 py-2 leading-none border rounded`};
  ${(props) =>
    !props.active
      ? tw`text-white border-white hover:border-transparent hover:text-blue-500 hover:bg-white`
      : tw`border-transparent text-blue-500 bg-white`}
`;

export function NavBar() {
  const { data } = useContext();
  const nav = (data?.collections?.mdxNav ?? []).sort((a, b) =>
    a.order < b.order ? -1 : 1
  );

  return (
    <nav tw="flex items-center justify-between flex-wrap bg-blue-500 p-6">
      <div tw="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
        <div>
          {nav.map((p) => (
            <NavLink key={p.key} active={p.url === data.page.url} href={p.url}>
              {p.key}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
