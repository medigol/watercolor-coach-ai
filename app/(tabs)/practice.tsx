import { Redirect } from "expo-router";
// Preserve the old deep link while replacing static samples with real studies.
export default function Practice() { return <Redirect href="/learn"/>; }
