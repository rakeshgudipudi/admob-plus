import assert from 'assert'
import _ from 'lodash'
import ts from 'typescript'
import { pkgsDirJoin } from '../utils'
import {
  indent4,
  renderJavaContants,
  renderSwiftContants,
  warnMessage,
} from './shared'

export const AdEvents = {
  // BannerAd
  bannerClick: 'banner.click',
  bannerClose: 'banner.close',
  bannerImpression: 'banner.impression',
  bannerLoad: 'banner.load',
  bannerLoadFail: 'banner.loadfail',
  bannerOpen: 'banner.open',
  bannerSizeChange: 'banner.sizechange',
  // InterstitialAd
  interstitialDismiss: 'interstitial.dismiss',
  interstitialImpression: 'interstitial.impression',
  interstitialLoad: 'interstitial.load',
  interstitialLoadFail: 'interstitial.loadfail',
  interstitialShow: 'interstitial.show',
  interstitialShowFail: 'interstitial.showfail',
  // RewardedAd
  rewardedDismiss: 'rewarded.dismiss',
  rewardedImpression: 'rewarded.impression',
  rewardedLoad: 'rewarded.load',
  rewardedLoadFail: 'rewarded.loadfail',
  rewardedReward: 'rewarded.reward',
  rewardedShow: 'rewarded.show',
  rewardedShowFail: 'rewarded.showfail',
  // RewardedInterstitialAd
  rewardedInterstitialDismiss: 'rewardedi.dismiss',
  rewardedInterstitialImpression: 'rewardedi.impression',
  rewardedInterstitialLoad: 'rewardedi.load',
  rewardedInterstitialLoadFail: 'rewardedi.loadfail',
  rewardedInterstitialReward: 'rewardedi.reward',
  rewardedInterstitialShow: 'rewardedi.show',
  rewardedInterstitialShowFail: 'rewardedi.showfail',
}
_.forEach(AdEvents, (v, k) => {
  assert.strictEqual(v, v.toLowerCase())
})

function buildJava(): string {
  const linesEvents = renderJavaContants(AdEvents)

  return `// ${warnMessage}
package admob.plus.capacitor;

public final class Generated {
    public final class Events {
${linesEvents}
    }
}
`
}

const pluginMethods = (() => {
  const definitionsPath = require.resolve(
    '@admob-plus/capacitor/src/definitions.ts',
  )
  const program = ts.createProgram([definitionsPath], {})
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(definitionsPath)
  /* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
  const type = checker.getTypeAtLocation(
    source
      ?.getChildAt(0)
      ?.getChildren()
      .find((x) => _.get(x, 'name.escapedText') === 'AdMobPlusPlugin')!,
  )
  /* eslint-enable @typescript-eslint/no-non-null-asserted-optional-chain */
  return checker.getPropertiesOfType(type).map((x) => x.getName())
})()

const buildIosMacro = () => `// ${warnMessage}
#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(AdMobPlusPlugin, "AdMobPlus",
${pluginMethods
    .map(
      (x) => `${indent4(2)}   CAP_PLUGIN_METHOD(${x}, CAPPluginReturnPromise);`,
    )
    .join('\n')}
)
`

function buildSwift(): string {
  const linesEvents = renderSwiftContants(AdEvents)

  return `// ${warnMessage}
struct AMBEvents {
${linesEvents}
}
`
}

const buildWeb = () => `// ${warnMessage}
import { WebPlugin } from '@capacitor/core'
import type { AdMobPlusPlugin } from './definitions'

export class AdMobPlusWeb extends WebPlugin implements AdMobPlusPlugin {
${pluginMethods
    .map(
      (x) => `  async ${x}(
    ...opts: Parameters<AdMobPlusPlugin['${x}']>
  ): ReturnType<AdMobPlusPlugin['${x}']> {
    console.log('${x}', opts)
  }`,
    )
    .join('\n\n')}
}
`

export default async () => ({
  files: [
    {
      path:
        'capacitor/android/src/main/java/admob/plus/capacitor/Generated.java',
      f: buildJava,
    },
    {
      path: 'capacitor/ios/Plugin/AdMobPlusPlugin.m',
      f: buildIosMacro,
    },
    {
      path: 'capacitor/ios/Plugin/AMBGenerated.swift',
      f: buildSwift,
    },
    {
      path: 'capacitor/src/web.ts',
      f: buildWeb,
    },
  ],
  pkgDir: pkgsDirJoin('capacitor'),
  targetDir: '',
})
