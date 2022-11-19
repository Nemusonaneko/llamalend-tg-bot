import fetch from "node-fetch";

export async function getLoans(address: string) {
  const loanData = await fetch(
    "https://api.thegraph.com/subgraphs/name/0xngmi/llamalend",
    {
      method: "POST",
      body: JSON.stringify({
        query: `query getLoan($address : Bytes) {
              loans(where: {owner: $address}) {
                  id
                  nftId
                  deadline
                  pool {
                    name
                  }
                }
              }`,
        variables: {
          address,
        },
      }),
    }
  ).then((r) => r.json());
  return loanData.data.loans as {
    id: string;
    nftId: string;
    deadline: number;
    pool: {
      name: string;
    };
  }[];
}
