import { useEffect, useRef } from 'react'
import {
  createChart, createSeriesMarkers, CandlestickSeries, HistogramSeries, LineSeries, LineStyle,
  type IChartApi, type ISeriesApi, type ISeriesMarkersPluginApi, type IPriceLine, type SeriesMarker, type Time, type UTCTimestamp,
} from 'lightweight-charts'
import type { Candle, Series } from '../lib/chart/types'

export interface LineSpec { key: string; data: Series; color: string; width?: number; dashed?: boolean }
export interface PaneSpec { key: string; title: string; lines: LineSpec[]; hist?: { data: Series; colors?: string[] }; levels?: number[] }
export interface PriceLineSpec { price: number; color: string; title: string; dashed?: boolean }

export interface PriceChartProps {
  candles: Candle[]
  developing?: Candle | null
  overlays?: LineSpec[]
  panes?: PaneSpec[]
  showVolume?: boolean
  markers?: SeriesMarker<Time>[]
  priceLines?: PriceLineSpec[]
  timeVisible?: boolean
  dark: boolean
  /** Changing this resets the visible range to the latest candles. */
  viewKey: string
  /** Keep the newest candle in view as data grows (replay). */
  follow?: boolean
  mainHeight?: number
}

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
const alpha = (hex: string, a: string) => (/^#[0-9a-f]{6}$/i.test(hex) ? hex + a : hex)
const t = (x: number) => x as UTCTimestamp

export default function PriceChart(props: PriceChartProps) {
  const box = useRef<HTMLDivElement>(null)
  const chart = useRef<IChartApi | null>(null)
  const main = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const vol = useRef<ISeriesApi<'Histogram'> | null>(null)
  const markersApi = useRef<ISeriesMarkersPluginApi<Time> | null>(null)
  const extra = useRef<{ sig: string; series: ISeriesApi<'Line' | 'Histogram'>[] }>({ sig: '', series: [] })
  const lines = useRef<IPriceLine[]>([])
  const view = useRef('')
  const mainHeight = props.mainHeight ?? 300
  const paneCount = props.panes?.length ?? 0
  const totalHeight = mainHeight + paneCount * 120

  // Create once
  useEffect(() => {
    if (!box.current) return
    const c = createChart(box.current, {
      height: totalHeight,
      autoSize: false,
      width: box.current.clientWidth,
      layout: { attributionLogo: true, fontSize: 11 },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, rightOffset: 4 },
      crosshair: { mode: 0 },
      handleScale: { axisPressedMouseMove: { time: true, price: false } },
    })
    chart.current = c
    main.current = c.addSeries(CandlestickSeries, { priceLineVisible: false })
    markersApi.current = createSeriesMarkers(main.current, [])
    const ro = new ResizeObserver(() => { if (box.current) c.applyOptions({ width: box.current.clientWidth }) })
    ro.observe(box.current)
    return () => { ro.disconnect(); c.remove(); chart.current = null; extra.current = { sig: '', series: [] }; lines.current = []; view.current = ''; vol.current = null }
  }, [])

  // Theme
  useEffect(() => {
    const c = chart.current
    if (!c || !main.current) return
    const fg = css('--muted'), line = css('--line')
    c.applyOptions({
      layout: { background: { color: css('--card') }, textColor: fg },
      grid: { vertLines: { color: alpha(line, '80') }, horzLines: { color: alpha(line, '80') } },
    })
    main.current.applyOptions({ upColor: css('--up'), downColor: css('--down'), borderUpColor: css('--up'), borderDownColor: css('--down'), wickUpColor: css('--up'), wickDownColor: css('--down') })
  }, [props.dark])

  // Data
  useEffect(() => {
    const c = chart.current, m = main.current
    if (!c || !m) return
    c.applyOptions({ height: totalHeight, timeScale: { timeVisible: !!props.timeVisible, secondsVisible: false } })
    const up = css('--up'), down = css('--down')
    const data = props.candles.map((x) => ({ time: t(x.time), open: x.open, high: x.high, low: x.low, close: x.close }))
    const dev = props.developing
    if (dev) {
      const col = alpha(dev.close >= dev.open ? up : down, '66')
      data.push({ time: t(dev.time), open: dev.open, high: dev.high, low: dev.low, close: dev.close, color: col, borderColor: col, wickColor: col } as typeof data[number])
    }
    m.setData(data)

    // Volume histogram in the main pane (bottom 20%)
    if (props.showVolume !== false) {
      if (!vol.current) {
        vol.current = c.addSeries(HistogramSeries, { priceScaleId: 'vol', priceFormat: { type: 'volume' }, lastValueVisible: false, priceLineVisible: false })
        vol.current.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })
      }
      const all = dev ? [...props.candles, dev] : props.candles
      vol.current.setData(all.map((x, i) => ({ time: t(x.time), value: x.volume, color: alpha(x.close >= x.open ? up : down, dev && i === all.length - 1 ? '33' : '66') })))
    } else if (vol.current) { c.removeSeries(vol.current); vol.current = null }

    // Overlays and indicator panes: rebuild only when the set changes
    const overlays = props.overlays ?? [], panes = props.panes ?? []
    const sig = overlays.map((o) => o.key).join(',') + '|' + panes.map((p) => p.key).join(',')
    const toLine = (s: Series) => props.candles.flatMap((x, i) => (s[i] === null || s[i] === undefined ? [] : [{ time: t(x.time), value: s[i]! }]))
    if (sig !== extra.current.sig) {
      for (const s of extra.current.series) c.removeSeries(s)
      for (let i = c.panes().length - 1; i > 0; i--) c.removePane(i)
      const series: ISeriesApi<'Line' | 'Histogram'>[] = []
      for (const o of overlays) series.push(c.addSeries(LineSeries, { color: o.color, lineWidth: (o.width ?? 2) as 1 | 2 | 3 | 4, lineStyle: o.dashed ? LineStyle.Dashed : LineStyle.Solid, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }))
      panes.forEach((p, idx) => {
        if (p.hist) series.push(c.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, idx + 1))
        p.lines.forEach((l, li) => {
          const s = c.addSeries(LineSeries, { color: l.color, lineWidth: (l.width ?? 2) as 1 | 2 | 3 | 4, lineStyle: l.dashed ? LineStyle.Dashed : LineStyle.Solid, priceLineVisible: false, lastValueVisible: li === 0, title: li === 0 ? p.title : '' }, idx + 1)
          if (li === 0) for (const lv of p.levels ?? []) s.createPriceLine({ price: lv, color: css('--muted'), lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: '' })
          series.push(s)
        })
      })
      c.panes().forEach((pn, i) => { if (i > 0) pn.setHeight(120) })
      extra.current = { sig, series }
    }
    let k = 0
    for (const o of overlays) (extra.current.series[k++] as ISeriesApi<'Line'>).setData(toLine(o.data))
    for (const p of panes) {
      if (p.hist) {
        const h = p.hist
        ;(extra.current.series[k++] as ISeriesApi<'Histogram'>).setData(props.candles.flatMap((x, i) => (h.data[i] === null ? [] : [{ time: t(x.time), value: h.data[i]!, color: h.colors?.[i] ?? alpha(h.data[i]! >= 0 ? up : down, '99') }])))
      }
      for (const l of p.lines) (extra.current.series[k++] as ISeriesApi<'Line'>).setData(toLine(l.data))
    }

    // Price lines (support/resistance, Fibonacci)
    for (const pl of lines.current) m.removePriceLine(pl)
    lines.current = (props.priceLines ?? []).map((pl) => m.createPriceLine({ price: pl.price, color: pl.color, lineWidth: 1, lineStyle: pl.dashed ? LineStyle.Dashed : LineStyle.Solid, axisLabelVisible: true, title: pl.title }))

    markersApi.current?.setMarkers(props.markers ?? [])

    if (view.current !== props.viewKey) {
      view.current = props.viewKey
      const n = data.length
      c.timeScale().setVisibleLogicalRange({ from: Math.max(0, n - 70), to: n + 3 })
    } else if (props.follow) {
      c.timeScale().scrollToRealTime()
    }
  })

  return <div ref={box} className="w-full overflow-hidden rounded-2xl border border-line" style={{ height: totalHeight }} />
}
