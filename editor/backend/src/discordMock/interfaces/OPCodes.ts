export interface IOPCode2 {
  op: 2;
  d: {
    intents: number;
    properties: {
      $referrer: string;
      $referring_domain: string;
      $os: string;
      $browser: string;
      $device: string;
    };
    compress: boolean;
    token: string;
    shard: [number, number];
  }
}
