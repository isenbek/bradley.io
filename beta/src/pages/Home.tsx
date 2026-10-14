// The front page: the ten scenes of the beta.bradley.io journey, in order, and nothing else (isenbek/bradley.io issues
// #3 to #9). For a local business owner with 90 seconds and a problem: each scene makes one point and proves it with
// something running. How far each one unfolds follows the zoom control in the header (issue #10). The kit tour lives
// under its own door in the Menu.
import { useRecord } from "../data";
import { S1Door } from "../scenes/S1Door";
import { S2Claim } from "../scenes/S2Claim";
import { S3TwoDays } from "../scenes/S3TwoDays";
import { S4Parts } from "../scenes/S4Parts";
import { S5Depth } from "../scenes/S5Depth";
import { S6Edge } from "../scenes/S6Edge";
import { FamilyStrip, S10Ask, S7Record, S8Craft, S9Process } from "../scenes/S7to10";

export default function Home() {
  const record = useRecord();
  return (
    <article className="bio-home">
      <S1Door record={record} />
      <S2Claim />
      <S3TwoDays />
      <S4Parts />
      <S5Depth />
      <S6Edge />
      <S7Record record={record} />
      <S8Craft />
      <S9Process />
      <S10Ask />
      <FamilyStrip />
    </article>
  );
}
