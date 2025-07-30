import { PGN, getAllPGNs, ManufacturerCode } from '@canboat/ts-pgns'
import { useObservableState } from 'observable-hooks'
import React from 'react'
import Select from 'react-select'
import { Col, Input, Label, Row, Table } from 'reactstrap'
import Creatable from 'react-select/creatable'

import { Subject } from 'rxjs'
import { PgnNumber, PGNDataMap } from '../types'

interface DataListProps {
  data: Subject<PGNDataMap>
  onRowClicked: (row: PGN) => void
  filterPgns: Subject<PgnNumber[]>
  doFiltering: Subject<boolean>
}

const filterFor = (doFiltering: boolean | undefined, pgnNumbers: PgnNumber[] | undefined) => {
  return () => true
  /*
  if (!doFiltering || pgnNumbers === undefined || pgnNumbers.length === 0) {
    return () => true
  }
  return (eventData: EventData) =>
    (eventData.event === 'N2KAnalyzerOut' && pgnNumbers.indexOf((eventData.data as PgnData).pgn as PgnNumber) >= 0) ||
    (eventData.event === 'canboatjs:unparsed:data' &&
      ((typeof eventData.data === 'string' &&
        pgnNumbers.indexOf(Number((eventData.data as string).split(',')[2]) as PgnNumber) >= 0) ||
        (isUnparsedPgn(eventData.data) && pgnNumbers.indexOf(eventData.data.pgn) >= 0)))
        */
}

export const DataList = (props: DataListProps) => {
  const data = useObservableState<PGNDataMap>(props.data)
  const filterPgns = useObservableState(props.filterPgns)
  const doFiltering = useObservableState(props.doFiltering)

  const addToFilteredPgns = (i: PgnNumber) => {
    const safeFilteredPgns = filterPgns || []
    if (safeFilteredPgns.indexOf(i) === -1) {
      props.filterPgns.next([...safeFilteredPgns, i])
    }
  }
  return (
    <div
      style={{
        width: '100%',
        height: '900px',
        overflow: 'auto',
      }}
    >
      <Table responsive bordered striped size="sm">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>pgn</th>
            <th>src</th>
            <th>dst</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {(data != undefined ? Object.values(data) : [])
            .filter(filterFor(doFiltering, filterPgns))
            .sort((a, b) => a.src! - b.src!)
            .map((row: PGN, i: number) => {
              return (
                <tr key={row.timestamp! + i}>
                  <td>{row.timestamp!.split('T')[1]}</td>
                  <td onClick={() => addToFilteredPgns(row.pgn as PgnNumber)}>{row.pgn}</td>
                  <td>{row.src}</td>
                  <td>{row.dst}</td>
                  <td
                    onClick={() => {
                      props.onRowClicked(row)
                    }}
                  >
                    <span style={{ fontFamily: 'monospace' }}>{row.getDefinition().Description}</span>
                  </td>
                </tr>
              )
            })}
        </tbody>
      </Table>
    </div>
  )
}

const pgnRow = (
  i: number,
  timestamp: string,
  pgn: string,
  src: string,
  input: string[],
  onClick: React.MouseEventHandler,
) => (
  <tr key={i}>
    <td>{timestamp.split('T')[1]}</td>
    <td style={{ color: 'red' }} onClick={onClick}>
      {pgn}
    </td>
    <td>{src}</td>
    <td>
      <span style={{ fontFamily: 'monospace' }}>{input.join(' ')}</span>
    </td>
  </tr>
)

const pgnOptions = getAllPGNs().map((pgn) => ({ value: pgn.PGN, label: `${pgn.PGN} ${pgn.Description}` }))
const pgnOptionsByPgn = pgnOptions.reduce<{
  [pgnNumber: PgnNumber]: {
    value: number
    label: string
  }
}>((acc, pgnOption) => {
  acc[pgnOption.value as PgnNumber] = pgnOption
  return acc
}, {})

const manufacturerCodeOptions = Object.values(ManufacturerCode).map((name) => ({
  value: name,
  label: name,
}))

const toPgnOption = (i: PgnNumber) =>
  pgnOptionsByPgn[i] || {
    value: i,
    label: `${i}`,
  }

const toSrcOption = (i: number) => ({
  value: i,
  label: `${i}`,
})

const toDstOption = (i: number) => ({
  value: i,
  label: `${i}`,
})

const toManufacturerOption = (i: string) => ({
  value: i,
  label: i,
})


export interface PgnOption {
  value: number
  label: string
}
interface FilterPanelProps {
  filterPgns: Subject<PgnNumber[]>
  filterSrcs: Subject<number[]>
  filterDsts: Subject<number[]>
  filterManufacturers: Subject<string[]>
  availableSrcs: Subject<number[]>
  doFiltering: Subject<boolean>
}
export const FilterPanel = (props: FilterPanelProps) => {
  const selectedPGNs = useObservableState(props.filterPgns)
  const selectedSrcs = useObservableState(props.filterSrcs)
  const selectedDsts = useObservableState(props.filterDsts)
  const selectedManufacturers = useObservableState(props.filterManufacturers)
  const availableSrcs = useObservableState(props.availableSrcs)
  const doFiltering = useObservableState(props.doFiltering)
  return (
    <>
      <Row>
        <Col xs="6" md="4">
          <Label htmlFor="pgns">PGNs</Label>
          <Creatable
            value={selectedPGNs?.map(toPgnOption)}
            isMulti
            name="pgns"
            options={pgnOptions}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={(values) => props.filterPgns.next(values.map((v) => v.value as PgnNumber))}
          />
        </Col>
        <Col xs="6" md="4">
          <Label htmlFor="srcs">Sources</Label>
          <Creatable
            value={selectedSrcs?.map(toSrcOption)}
            isMulti
            name="srcs"
            options={availableSrcs?.map(toSrcOption)}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={(values) => props.filterSrcs.next(values.map((v) => v.value))}
          />
        </Col>
        <Col xs="6" md="4">
          <Label htmlFor="dsts">Destinations</Label>
          <Creatable
            value={selectedDsts?.map(toDstOption)}
            isMulti
            name="dsts"
            options={availableSrcs?.map(toDstOption)}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={(values) => props.filterDsts.next(values.map((v) => v.value))}
          />
        </Col>
      </Row>
      <Row>
        <Col xs="6" md="5">
          <Label htmlFor="manufacturers">Manufacturers</Label>
          <Creatable
            value={selectedManufacturers?.map(toManufacturerOption)}
            isMulti
            name="manufacturers"
            options={manufacturerCodeOptions}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={(values) => props.filterManufacturers.next(values.map((v) => v.value))}
          />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="5" align="left">
          <Label className="switch switch-text switch-primary">
            <Input
              type="checkbox"
              id="Meta"
              name="meta"
              className="switch-input"
              onChange={() => props.doFiltering.next(!doFiltering)}
              checked={doFiltering}
            />
            <span className="switch-label" data-on="Yes" data-off="No" />
            <span className="switch-handle" />
          </Label>
          <span style={{ lineHeight: '24px' }}>Enable Filtering</span>

        </Col>
      </Row>
    </>
  )
}
