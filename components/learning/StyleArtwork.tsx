import { useId } from "react";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Path,
  Rect,
  Ellipse,
  Circle,
  G,
  Filter,
  FeGaussianBlur,
} from "react-native-svg";
import { View } from "react-native";
import type { StyleId } from "../../learning/types";
const hill =
  "M-20 174C30 157 48 164 78 150S128 143 151 130S195 148 222 129S273 132 304 115S349 139 377 128S425 153 456 141S516 159 550 149V240H-20Z";
const near =
  "M-10 290C35 249 70 270 104 243S157 259 186 240S225 263 263 241S308 262 342 239S402 226 435 231S501 217 550 229V350H-10Z";
const leaf = (x: number, y: number, a: number) =>
  `M${x} ${y}C${x - 60 * a} ${y - 55} ${x - 100 * a} ${y - 42} ${x - 117 * a} ${y - 111}C${x - 49 * a} ${y - 113} ${x + 7 * a} ${y - 52} ${x} ${y}Z`;
/** Original digital illustrations of visual decisions. No physical-paint claim. */
export default function StyleArtwork({ styleId }: { styleId: StyleId }) {
  const uid = useId().replace(/:/g, "");
  const id = (s: string) => `art-${uid}-${s}`;
  const branch = styleId === "botanical";
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={
        {
          atmospheric:
            "Original illustration: translucent river-valley masses, softened distant contours and a small defined cottage",
          urban:
            "Original illustration: an economical cottage and street sketch with broken contours and loosely suggested people",
          botanical:
            "Original illustration: a flowering branch with deliberate silhouettes, translucent overlapping colour and selected veins",
          expressive:
            "Original illustration: a cottage and landscape reinterpreted through broad directional marks, colour overlaps and open gaps",
        }[styleId]
      }
      style={{
        width: "100%",
        aspectRatio: 1.55,
        overflow: "hidden",
        borderRadius: 6,
      }}
    >
      <Svg
        aria-hidden={true}
        accessible={false}
        width="100%"
        height="100%"
        viewBox="0 0 540 350"
      >
        <Defs>
          <LinearGradient id={id("sky")} x1="0" y1="0" x2="0.25" y2="1">
            <Stop offset="0" stopColor="#90b2b9" stopOpacity={0.6} />
            <Stop offset=".6" stopColor="#c7d3c6" stopOpacity={0.18} />
            <Stop offset="1" stopColor="#f7edce" stopOpacity={0.4} />
          </LinearGradient>
          <LinearGradient id={id("wash")} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#466d7a" stopOpacity={0.18} />
            <Stop offset=".5" stopColor="#6b9691" stopOpacity={0.58} />
            <Stop offset="1" stopColor="#c7b991" stopOpacity={0.16} />
          </LinearGradient>
          <LinearGradient id={id("bank")} x1="0" y1="0" x2=".2" y2="1">
            <Stop offset="0" stopColor="#678575" stopOpacity={0.6} />
            <Stop offset="1" stopColor="#294e50" stopOpacity={0.95} />
          </LinearGradient>
          <LinearGradient id={id("leaf")} x1="0" y1="0" x2="1" y2=".5">
            <Stop offset="0" stopColor="#b8bf64" stopOpacity={0.55} />
            <Stop offset=".5" stopColor="#66936f" stopOpacity={0.7} />
            <Stop offset="1" stopColor="#345f59" stopOpacity={0.85} />
          </LinearGradient>
          <RadialGradient id={id("rose")} cx=".65" cy=".68" r=".8">
            <Stop offset="0" stopColor="#a55b65" stopOpacity={0.72} />
            <Stop offset=".55" stopColor="#c88c8b" stopOpacity={0.32} />
            <Stop offset="1" stopColor="#f4d2bd" stopOpacity={0.15} />
          </RadialGradient>
          <Filter
            id={id("distance")}
            x="-10%"
            y="-20%"
            width="120%"
            height="140%"
          >
            <FeGaussianBlur stdDeviation={3.2} />
          </Filter>
          <Filter id={id("join")} x="-10%" y="-20%" width="120%" height="140%">
            <FeGaussianBlur stdDeviation={1.3} />
          </Filter>
        </Defs>
        <Rect width="540" height="350" fill="#f8f2e2" />
        {!branch && (
          <>
            <Path
              d="M-5 10Q78 28 135 7T264 18T412 9L548 15V240Q470 227 419 245T295 229T164 241T-5 222Z"
              fill={`url(#${id("sky")})`}
            />
            <Path
              d={hill}
              fill={`url(#${id("wash")})`}
              filter={
                styleId === "atmospheric"
                  ? `url(#${id("distance")})`
                  : undefined
              }
            />
            <Path
              d="M-9 235Q105 199 181 224T337 205T550 219V295Q453 277 378 299T215 283T-9 308Z"
              fill="#c4c4a6"
              opacity={0.4}
            />
          </>
        )}
        {styleId === "atmospheric" && (
          <>
            <Path
              d="M-15 203Q59 181 118 197T243 182T358 181T550 189V240Q447 234 394 224T251 236T-15 229Z"
              fill="#809c95"
              opacity={0.46}
              filter={`url(#${id("join")})`}
            />
            <Path
              d="M38 259Q156 220 241 240T425 222L490 242Q363 228 282 270T56 304Z"
              fill="#faf3dc"
              opacity={0.85}
            />
            <Path d={near} fill={`url(#${id("bank")})`} />
            <Path
              d="M-9 322Q96 280 156 296T288 278"
              stroke="#345852"
              strokeWidth={14}
              opacity={0.35}
              fill="none"
            />
            <Path
              d="M321 211L346 190L374 207L373 238L322 239Z"
              fill="#e3c491"
              opacity={0.86}
            />
            <Path
              d="M315 212L345 187L381 208L371 212L345 196L323 214"
              fill="#8f6554"
            />
            <Path d="M354 216L362 216L362 237L353 238Z" fill="#3f5552" />
            <Path d="M327 220H335V227H327Z" fill="#667d76" />
            {[0, 1, 2, 3, 4].map((n) => (
              <Path
                key={n}
                d={`M${395 + n * 8} ${230 - n * 2}q-8 -11 1 -19q8 6 3 12q7 5 1 10`}
                fill="#4e6c60"
                opacity={0.65 - n * 0.06}
              />
            ))}
            <Path
              d="M250 263Q290 247 321 239"
              stroke="#e3d5ad"
              strokeWidth={5}
              opacity={0.7}
              fill="none"
            />
            <Path
              d="M12 297L69 280M85 290L110 279M408 282L461 264"
              stroke="#f5eed6"
              strokeWidth={3}
              opacity={0.7}
            />
          </>
        )}
        {styleId === "urban" && (
          <>
            <Path
              d="M77 228L77 143L146 108L226 137L228 231L273 215L280 106L356 74L447 119L453 237L526 232L535 280L18 307L-4 254Z"
              fill="#c39c68"
              opacity={0.25}
            />
            <Path
              d="M82 151L141 119L210 142L217 222L142 234L80 225Z"
              fill="#b7815c"
              opacity={0.24}
            />
            <Path
              d="M285 114L355 82L439 125L446 216L357 232L285 216Z"
              fill="#d1b279"
              opacity={0.5}
            />
            <Path
              d="M42 278L245 232L389 269L550 234V330L21 346Z"
              fill="#718f92"
              opacity={0.48}
            />
            <Path
              d="M75 211L73 144L144 106L232 139M82 147L143 119L217 145L220 222M143 121L144 228M105 165V186M173 163V183M94 224L149 237L203 226M279 213L278 108L355 73L452 117M290 118L355 89L441 125L448 215M357 88V216M308 137V161M329 128V151M381 135V159M410 145V168M380 185L381 215M305 187H326V209M417 205L446 218M12 292L134 256M254 254L335 236M427 261L526 242"
              stroke="#3d514e"
              strokeWidth={2.1}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M125 247L168 234L209 248L231 244"
              stroke="#9c5d46"
              strokeWidth={8}
              opacity={0.75}
              fill="none"
            />
            {[
              { x: 247, y: 243 },
              { x: 268, y: 249 },
              { x: 376, y: 239 },
            ].map(({ x, y }) => (
              <G key={x}>
                <Ellipse cx={x} cy={y - 16} rx={3.5} ry={4.5} fill="#4f5350" />
                <Path
                  d={`M${x} ${y - 11}l-4 16m4-16l5 16m-7-12l-3 13m4-12l4 13`}
                  stroke="#3f5655"
                  strokeWidth={3}
                  fill="none"
                />
              </G>
            ))}
            <Path
              d="M465 145q14-23 28-8t18 8m-36 7q17-13 30-3"
              stroke="#7e916d"
              strokeWidth={13}
              opacity={0.5}
              fill="none"
            />
          </>
        )}
        {styleId === "botanical" && (
          <>
            <Path
              d="M125 333Q218 230 274 131T330 31"
              stroke="#6e7751"
              strokeWidth={3}
              fill="none"
            />
            <Path
              d={leaf(223, 216, 1)}
              fill={`url(#${id("leaf")})`}
              stroke="#618364"
              strokeWidth={0.7}
            />
            <Path
              d={leaf(267, 145, -1)}
              fill={`url(#${id("leaf")})`}
              opacity={0.85}
              stroke="#618364"
              strokeWidth={0.7}
            />
            <Path
              d={leaf(179, 278, -1)}
              fill={`url(#${id("leaf")})`}
              opacity={0.85}
            />
            <Path
              d="M218 207Q175 151 113 111M272 136Q324 89 377 43M187 271Q241 232 292 183"
              stroke="#dde0a7"
              strokeWidth={2}
              fill="none"
            />
            {[0, 1, 2, 3].map((n) => (
              <G key={n} opacity={0.4}>
                <Path
                  d={`M${142 + n * 17} ${135 + n * 18}l-6 -22m7 23l-22 -2M${301 + n * 17} ${110 - n * 17}l2 -20m-1 21l20 -3`}
                  stroke="#3e7869"
                  strokeWidth={0.8}
                  fill="none"
                />
              </G>
            ))}
            <Path
              d="M310 97C257 108 242 75 257 52C269 32 296 41 302 53C287 13 323 4 345 22C363 36 357 55 347 66C380 30 414 56 405 80C400 103 367 106 349 91C356 128 319 139 303 119Z"
              fill={`url(#${id("rose")})`}
            />
            <Path
              d="M302 54Q316 45 331 65Q346 49 352 70Q363 94 333 103Q308 100 310 81Q286 76 302 54Z"
              fill="#b65f75"
              opacity={0.22}
            />
            <Path
              d="M308 80Q325 70 338 80T352 80M315 91Q336 101 346 90"
              stroke="#aa5b6c"
              strokeWidth={1}
              opacity={0.55}
              fill="none"
            />
            <Circle cx={329} cy={82} r={3.5} fill="#b39050" />
            <Circle cx={337} cy={85} r={2} fill="#8e7850" />
          </>
        )}
        {styleId === "expressive" && (
          <>
            <Path
              d="M-9 76L162 30L277 62L461 9L548 61L375 119L206 96L76 138Z"
              fill="#d18b61"
              opacity={0.52}
            />
            <Path
              d="M-10 191L88 147L181 168L277 111L398 142L544 110L522 201L359 238L228 205L106 246L-15 223Z"
              fill="#547f8c"
              opacity={0.55}
            />
            <Path
              d="M241 223L279 104L337 142L386 105L439 231L370 214L330 248Z"
              fill="#ba6652"
              opacity={0.66}
            />
            <Path
              d="M270 148L330 121L389 155L425 145"
              stroke="#4e5960"
              strokeWidth={9}
              fill="none"
            />
            <Path
              d="M280 153L316 237M361 158L380 211M309 174L320 194"
              stroke="#28575e"
              strokeWidth={8}
              opacity={0.8}
            />
            <Path d={near} fill="#3e625f" opacity={0.9} />
            <Path
              d="M17 311L103 269L165 287M205 296L275 254M414 266L512 220"
              stroke="#f0d7a8"
              strokeWidth={11}
              fill="none"
            />
            <Path
              d="M34 229L98 203M125 216L176 191M425 182L483 160"
              stroke="#497772"
              strokeWidth={15}
              opacity={0.75}
            />
            <Path
              d="M45 300L76 286M91 284L107 277M444 251L462 243"
              stroke="#f8f2e2"
              strokeWidth={3}
              fill="none"
            />
          </>
        )}
      </Svg>
    </View>
  );
}
