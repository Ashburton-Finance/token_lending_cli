use std::convert::TryInto;

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    msg!("Medad's special Flash Loan Receiver invoked");

    msg!(&accounts.len().to_string());
    let account_info_iter = &mut accounts.iter();

    msg!("Medad's special Flash Loan Receiver invoked1");

    let destination_liq_info = next_account_info(account_info_iter)?;

    msg!(&destination_liq_info.key.to_string());
    msg!("Medad's special Flash Loan Receiver invoked2");

    let source_liq_info = next_account_info(account_info_iter)?;
    msg!(&source_liq_info.key.to_string());

    msg!("Medad's special Flash Loan Receiver invoked3");

    let spl_token_program_info = next_account_info(account_info_iter)?;
    msg!(&spl_token_program_info.key.to_string());

    msg!("Medad's special Flash Loan Receiver invoked4");

    let user_transfer_authority_info = next_account_info(account_info_iter)?;
    msg!(&user_transfer_authority_info.key.to_string());

    msg!("Medad's special Flash Loan Receiver invoked5");

    let (tag, rest) = input
        .split_first()
        .ok_or(ProgramError::InvalidInstructionData)?;

    msg!("Medad's special Flash Loan Receiver invoked6");

    //make sure the 0th instruction is called
    if *tag != 0 {
        msg!("tag must be 0");
        return Err(ProgramError::InvalidInstructionData);
    }

    msg!("Medad's special Flash Loan Receiver invoked7");

    //unpack amount as u64
    let amount = unpack_amount(rest)?;

    msg!("Medad's special Flash Loan Receiver invoked8");

    //send the tokens back to where they came from
    let _result = invoke(
        &spl_token::instruction::transfer(
            spl_token_program_info.key,
            destination_liq_info.key,
            source_liq_info.key,
            user_transfer_authority_info.key,
            &[],
            amount,
        )?,
        &[
            source_liq_info.clone(),
            destination_liq_info.clone(),
            user_transfer_authority_info.clone(),
            spl_token_program_info.clone(),
        ],
    );
    Ok(())
}

fn unpack_amount(input: &[u8]) -> Result<u64, ProgramError> {
    let amount = input
        .get(..8)
        .and_then(|slice| slice.try_into().ok())
        .map(u64::from_le_bytes)
        .ok_or(ProgramError::InvalidInstructionData)
        .map_err(|e| {
            msg!("failed to unpack amount");
            e
        })?;
    Ok(amount)
}
