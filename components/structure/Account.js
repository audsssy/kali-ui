import { useContext } from "react";
import AppContext from "../../context/AppContext";
import { Button, Text } from "@chakra-ui/react";
import { truncateAddress } from "../../utils/formatters";

export default function Account(props) {
  const value = useContext(AppContext);
  const { account } = value.state;

  const copy = async () => {
    await navigator.clipboard.writeText(account);
    alert("Text copied");
  };

  return (
    <Button variant="link" onClick={value.connect} border="none">
      {account == null ? "connect" : truncateAddress(account)}
    </Button>
  );
}
