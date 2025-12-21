import { Composition } from "remotion";
import {
  KineticTypography,
  kineticTypographySchema,
  type KineticTypographyProps,
} from "./compositions/KineticTypography";

const defaultProps: KineticTypographyProps = {
  words: [
    { word: "Context", startTime: 0, endTime: 0.5, charIndex: 0 },
    { word: "Engineering", startTime: 0.5, endTime: 1.2, charIndex: 8 },
    { word: "—", startTime: 1.2, endTime: 1.4, charIndex: 19 },
    { word: "это", startTime: 1.4, endTime: 1.6, charIndex: 21 },
    { word: "новый", startTime: 1.6, endTime: 2.0, charIndex: 25 },
    { word: "подход", startTime: 2.0, endTime: 2.5, charIndex: 31 },
    { word: "к", startTime: 2.5, endTime: 2.6, charIndex: 38 },
    { word: "разработке", startTime: 2.6, endTime: 3.2, charIndex: 40 },
    { word: "AI", startTime: 3.2, endTime: 3.5, charIndex: 51 },
    { word: "приложений.", startTime: 3.5, endTime: 4.2, charIndex: 54 },
  ],
  keyPhrases: ["Context Engineering", "новый подход", "AI приложений"],
  theme: {
    backgroundColor: "#0a0a0a",
    textColor: "#ffffff",
    accentColor: "#3b82f6",
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 400,
    emphasisFontWeight: 700,
  },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="KineticTypography"
        component={KineticTypography}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        schema={kineticTypographySchema}
        defaultProps={defaultProps}
      />
    </>
  );
};
