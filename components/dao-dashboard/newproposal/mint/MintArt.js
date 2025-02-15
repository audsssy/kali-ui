import React, { useState, useEffect } from 'react'
import { useAccount, useNetwork, useContract, useContractRead, useSigner, erc721ABI } from 'wagmi'
import { Flex, Text, Button, Warning, Box, Image } from '../../../../styles/elements'
import { Form, FormElement, Label, Input, Select } from '../../../../styles/form-elements'
import { ethers } from 'ethers'
import FileUploader from '../../../tools/FileUpload'
import KALIDAO_ABI from '../../../../abi/KaliDAO.json'
import KALINFT_ABI from '../../../../abi/KaliNFT.json'
import { useRouter } from 'next/router'
import { isHolder } from '../../../../utils'
import { uploadIpfs } from '../../../tools/ipfsHelpers'
import Back from '../../../../styles/proposal/Back'
import { addresses } from '../../../../constants/addresses'

export default function MintArt({ setProposal }) {
  const router = useRouter()
  const daoAddress = router.query.dao
  const daoChainId = router.query.chainId
  const { data: signer, isLoading } = useSigner()
  const { data: daoName } = useContractRead(
    {
      addressOrName: daoAddress,
      contractInterface: KALIDAO_ABI,
    },
    'name',
    {
      chainId: Number(daoChainId),
    },
  )
  // const { data: _totalSupply, error } = useContractRead(
  //   {
  //     addressOrName: addresses[daoChainId]['nft'],
  //     contractInterface: KALINFT_ABI,
  //   },
  //   'symbol',
  //   {
  //     chainId: Number(daoChainId),
  //   },
  // )

  // form
  const [title, setTitle] = useState(null)
  const [description, setDescription] = useState(null)
  const [terms, setTerms] = useState('none')
  const [totalSupply, setTotalSupply] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [warning, setWarning] = useState()

  const buildMetadata = async () => {
    const date = new Date()
    const timestamp = date.getTime()

    if (title && description && file && terms) {
      const hash = await uploadIpfs(daoAddress, `KaliNFT #${totalSupply}`, file)
      const metadata = {
        title: title,
        description: description,
        image: hash,
        createdAt: timestamp,
        terms: terms,
      }
      setWarning(null)
      return metadata
    } else {
      setWarning('Please supply title, description, and terms for the artwork.')
      return
    }
  }

  // Preview upload
  useEffect(() => {
    if (!file) {
      setPreview(null)
    }

    if (file) {
      const _preview = URL.createObjectURL(file)
      setPreview(_preview)

      return () => URL.revokeObjectURL(_preview)
    }
  }, [file])

  // Get KaliNFT total supply
  useEffect(() => {
    const getTotalSupply = async () => {
      try {
        const instance = new ethers.Contract(addresses[daoChainId]['nft'], KALINFT_ABI, signer)
        const _totalSupply = await instance.totalSupply()
        _totalSupply = ethers.utils.formatUnits(_totalSupply, 'wei')
        setTotalSupply(_totalSupply)
        setWarning(null)
      } catch (e) {
        setWarning('Error connecting to network.')
        console.log(e)
      }
    }
    getTotalSupply()
  }, [signer, isLoading])

  // TODO: Popup to change network if on different network from DAO
  const submit = async (e) => {
    e.preventDefault()

    const _totalSupply = ethers.utils.parseUnits(totalSupply, 'wei')
    const metadata = await buildMetadata()
    let tokenUri

    if (metadata) {
      const data = JSON.stringify(metadata)
      console.log(data)
      tokenUri = await uploadIpfs(daoAddress, `KaliNFT #${totalSupply} Metadata`, data)
    }

    try {
      const instance = new ethers.Contract(addresses[daoChainId]['nft'], KALINFT_ABI, signer)
      const tx = await instance.mint(daoAddress, _totalSupply, tokenUri)
      console.log('tx', tx)
    } catch (e) {
      console.log('error', e)
    }
  }

  return (
    <Flex dir="col" gap="md">
      <Text>Mint an artwork NFT to {daoName}</Text>
      <Form>
        <FormElement>
          <Label htmlFor="contractAddress">Title</Label>
          <Input name="contractAddress" type="text" defaultValue={title} onChange={(e) => setTitle(e.target.value)} />
        </FormElement>
        <FormElement variant="vertical">
          <Label htmlFor="contractAddress">Description</Label>
          <Input
            as="textarea"
            name="description"
            type="text"
            defaultValue={description}
            onChange={(e) => setDescription(e.target.value)}
            css={{ padding: '0.5rem', width: '97%', height: '10vh' }}
          />
        </FormElement>
        <FormElement>
          <Label htmlFor="type">Terms</Label>
          <Select name="type" onChange={(e) => setTerms(e.target.value)} defaultValue={terms}>
            <Select.Item value="none">None</Select.Item>
            <Select.Item value="cc0">CC0</Select.Item>
          </Select>
        </FormElement>
        <FormElement>
          <Label htmlFor="upload">Upload</Label>
          <FileUploader setFile={setFile} setPreview={setPreview} />
        </FormElement>
        <FormElement variant="vertical">
          <Label htmlFor="preview">Preview</Label>
          {file && (
            <Box
              css={{
                height: '150px',
                width: '150px',
              }}
            >
              <img src={preview} height="100%" width="100%" alt="Artwork" />
            </Box>
          )}
        </FormElement>
        {warning && <Warning warning={warning} />}
        <Back onClick={() => setProposal('mintMenu')} />
        <Button onClick={submit}>Submit</Button>
      </Form>
    </Flex>
  )
}
