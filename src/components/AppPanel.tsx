import React, { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader, Col, Row } from 'reactstrap'
import { ReplaySubject } from 'rxjs'
// import * as pkg from '../../package.json'
import { EventData, PGNDataMap, PgnNumber } from '../types'
import { DataList, FilterPanel, PgnOption } from './DataList'
import { SentencePanel } from './SentencePanel'
import { FromPgn } from '@canboat/canboatjs'
import { PGN } from '@canboat/ts-pgns'

// const SAFEPLUGINID = pkg.name.replace(/[-@/]/g, '_')
// const saveSettingsItems = (items: any) => {
//   let settings
//   try {
//     settings = JSON.parse(window.localStorage.getItem(SAFEPLUGINID) || '')
//   } catch (e) {
//     settings = {}
//   }
//   window.localStorage.setItem(SAFEPLUGINID, JSON.stringify({ ...settings, ...items }))
// }

const AppPanel = (props: any) => {
  const [ws, setWs] = useState(null)
  const [data] = useState(new ReplaySubject<PGNDataMap>())
  const [list, setList] = useState<any>({})
  const [selectedPgn] = useState(new ReplaySubject<PGN>())
  const [doFiltering] = useState(new ReplaySubject<boolean>())
  const [filterPgns] = useState(new ReplaySubject<PgnNumber[]>())
  const parser = new FromPgn({
    returnNulls: true,
    checkForInvalidFields: true,
    useCamel: true,
    useCamelCompat: false,
    returnNonMatches: true,
    createPGNObjects: true,
    includeInputData: true
  })
  

  parser.on('error', (pgn: any, error: any) => {
    console.error(`Error parsing ${pgn.pgn} ${error}`)
    console.error(error.stack)
  })

  useEffect(() => {
    const ws = props.adminUI.openWebsocket({
      subscribe: 'none',
      events: 'canboatjs:rawoutput',
    })
   
    ws.onmessage = (x: any) => {
      //console.log('Received dataX', x)

      const parsed = JSON.parse(x.data)
      if (parsed.event !== 'canboatjs:rawoutput') {
        return
      }
      let pgn: PGN | undefined = undefined
      pgn = parser.parse(parsed.data)
      if (pgn) {
        //console.log('pgn', pgn)
        setList((prev:any) => {
          prev[`${pgn!.getDefinition().Id}-${pgn!.src}`] = pgn
          data.next({...prev})
          return prev
        })
      }
    }
    setWs(ws)
  }, [])

  return (
    <Card>
      <CardHeader>NMEA 2000 Debugging Utility</CardHeader>
      <CardBody>
        <div id="content">
          <Row>
            <Col xs="12" md="6">
              <FilterPanel doFiltering={doFiltering} filterPgns={filterPgns} />
            </Col>
          </Row>
          <Row>
            <Col xs="12" md="6">
              <DataList
                data={data}
                filterPgns={filterPgns}
                doFiltering={doFiltering}
                onRowClicked={(row: PGN) => {
                  selectedPgn.next(row)
                }}
              />
            </Col>
            <Col xs="12" md="6">
              <SentencePanel selectedPgn={selectedPgn}></SentencePanel>
            </Col>
          </Row>
        </div>
      </CardBody>
    </Card>
  )
}

export default AppPanel
