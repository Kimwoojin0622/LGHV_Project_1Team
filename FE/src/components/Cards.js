import React from "react";
import { Card, Heading, Text } from "@aws-amplify/ui-react";

const Cards = ({ items }) => {
  return (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      {items.map((item, index) => (
        <Card key={index} style={{ width: "200px", padding: "1rem" }}>
          <Heading level={5}>{item.title}</Heading>
          <Text>{item.description}</Text>
        </Card>
      ))}
    </div>
  );
};

export default Cards;
